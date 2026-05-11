import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notificationService';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Validate cron secret
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find reservations that are APPROVED and have ended
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        res_status: 'APPROVED',
        res_endTime: { lt: now },
      },
      include: {
        user: {
          select: { user_id: true, name: true },
        },
        room: {
          select: { room_name: true },
        },
      },
    });

    let processedCount = 0;

    for (const reservation of expiredReservations) {
      // Update reservation status to COMPLETED to prevent reprocessing
      await prisma.reservation.update({
        where: { res_id: reservation.res_id },
        data: { res_status: 'COMPLETED' },
      });

      // Send notification to the user
      try {
        await sendNotification(
          reservation.user.user_id,
          'RESERVATION_COMPLETED',
          'Reservasi Selesai',
          `Peminjaman ${reservation.room.room_name} Anda telah berakhir`,
          { reservationId: reservation.res_id }
        );
        processedCount++;
      } catch (error) {
        console.error(`Failed to send completion notification for reservation ${reservation.res_id}:`, error);
        // Continue processing other reservations
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      message: `Processed ${processedCount} completed reservations`,
    });
  } catch (error) {
    console.error('Error in check-completed-reservations cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}