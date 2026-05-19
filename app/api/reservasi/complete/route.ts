import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import { isSuperadminUser } from "@/lib/admin-access";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperadminUser(session.user)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const reservationId = url.searchParams.get("id");

    if (!reservationId) {
      return Response.json({ error: "ID pengajuan tidak diberikan" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { res_id: reservationId },
    });

    if (!reservation) {
      return Response.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (reservation.res_status === "COMPLETED") {
      return Response.json({ error: "Pengajuan sudah berstatus Selesai" }, { status: 400 });
    }

    const normalizedStatus = reservation.res_status.toUpperCase();
    const isPendingStatus = normalizedStatus.startsWith("PENDING");
    const isApprovedStatus = normalizedStatus === "APPROVED" || normalizedStatus === "DISETUJUI";

    if (!isPendingStatus && !isApprovedStatus) {
      return Response.json(
        { error: "Hanya pengajuan yang masih diproses atau sudah disetujui yang dapat diselesaikan" },
        { status: 400 },
      );
    }

    const now = new Date();
    const processedBy = session.user.email || session.user.id || "System";

    await prisma.reservation.update({
      where: { res_id: reservationId },
      data: {
        res_status: "COMPLETED",
        res_processedAt: now,
        res_processedBy: processedBy,
        ...(reservation.res_decisionAt ? {} : { res_decisionAt: now }), // Set decisionAt if not set
      },
    });

    return Response.json(
      { message: "Pengajuan berhasil diselesaikan", status: "COMPLETED", processedAt: now.toISOString() },
      { status: 200 }
    );
  } catch (error) {
    logServerError("[api/reservasi/complete] Failed to complete reservation", error, getRequestLogMeta(request));
    return Response.json(
      { error: "Gagal menyelesaikan pengajuan" },
      { status: 500 }
    );
  }
}
