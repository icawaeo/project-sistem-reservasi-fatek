import { prisma } from '@/lib/prisma';
import { messaging } from '@/lib/firebase'; // This is the admin messaging from firebase-admin

export type NotificationType =
  | 'RESERVATION_NEW'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_COMPLETED'
  | 'RESERVATION_CANCELLED';

/**
 * Create a notification record and send FCM to user's devices
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  // 1. Save notification to DB
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      data,
    },
  });

  // 2. Get active FCM tokens for user
  const tokens = await prisma.fcmToken.findMany({
    where: { userId, isActive: true },
    select: { token: true },
  });

  // 3. Send FCM message if tokens exist
  if (tokens.length > 0) {
    const fcmTokens = tokens.map((t) => t.token);
    try {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title,
          body,
        },
        data: {
          type,
          ...data,
          notificationId: notification.id,
        },
      });
    } catch (error) {
      console.error('Error sending FCM multicast:', error);
      // Optionally, you might want to mark tokens as invalid if error is registration-token-not-registered
    }
  }

  return notification;
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}