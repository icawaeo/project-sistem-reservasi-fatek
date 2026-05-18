import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import { sendNotification } from "@/lib/notificationService";
import { generateDecisionLetterForReservation } from "@/lib/decision-letter";

type DecisionAction = "APPROVE" | "REJECT";

type ApproverRole = "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "KAJUR" | "KEPALA_LAB";
type ReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

type SessionUser = {
  id: string;
  role: string;
  email?: string | null;
};

const normalizeRole = (role: string | null | undefined) => (role ?? "").toUpperCase();

const resolveNextStatus = (params: {
  currentStatus: string;
  role: ApproverRole;
  action: DecisionAction;
  flow: ReservationFlow;
}) => {
  const current = params.currentStatus.toUpperCase();
  const role = params.role.toUpperCase() as ApproverRole;
  const flow = params.flow.toUpperCase() as ReservationFlow;

  if (params.action === "APPROVE") {
    if (role === "ADMIN") {
      if (current === "PENDING" || current === "PENDING_KABAG") {
        if (flow === "LAB_SKRIPSI") return "PENDING_KEPALA_LAB";
        if (flow === "LAB_LAINNYA") return "PENDING_KAJUR";
        return "PENDING_DEKAN";
      }
      return null;
    }

    if (role === "ADMIN_DEKAN") {
      if (current === "PENDING_DEKAN") return "PENDING_WD2";
      return null;
    }

    if (role === "ADMIN_WD2") {
      if (current === "PENDING_WD2" || current === "PENDING_WAKIL_DEKAN_2") return "APPROVED";
      return null;
    }

    if (role === "KAJUR") {
      if (current === "PENDING_KAJUR") return "PENDING_KEPALA_LAB";
      return null;
    }

    if (role === "KEPALA_LAB") {
      if (current === "PENDING_KEPALA_LAB") return "APPROVED";
      return null;
    }

    return null;
  }

  if (params.action === "REJECT") {
    if (role === "ADMIN") {
      return null;
    }

    if (role === "ADMIN_DEKAN") {
      if (current === "PENDING_DEKAN") return "REJECTED_DEKAN";
      return null;
    }

    if (role === "ADMIN_WD2") {
      return null;
    }

    if (role === "KAJUR") {
      if (current === "PENDING_KAJUR") return "REJECTED_KAJUR";
      return null;
    }

    if (role === "KEPALA_LAB") {
      if (current === "PENDING_KEPALA_LAB") return "REJECTED_KEPALA_LAB";
      return null;
    }

    return null;
  }

  return null;
};

const normalizeApproverRole = (role: string | null | undefined): ApproverRole | null => {
  const normalized = normalizeRole(role);
  if (
    normalized === "ADMIN" ||
    normalized === "ADMIN_DEKAN" ||
    normalized === "ADMIN_WD2" ||
    normalized === "KAJUR" ||
    normalized === "KEPALA_LAB"
  ) {
    return normalized as ApproverRole;
  }
  return null;
};

const ensureApprover = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userSession = session.user as SessionUser;
  const dbUser = await prisma.user.findUnique({
    where: { user_id: userSession.id },
    select: { user_id: true, email: true, role: true, departmentScope: true, programScope: true },
  });

  const role = normalizeApproverRole(dbUser?.role);

  if (!dbUser || !role) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    ok: true as const,
    user: {
      id: dbUser.user_id,
      role,
      email: dbUser.email ?? null,
      departmentScope: dbUser.departmentScope,
      programScope: dbUser.programScope,
    },
  };
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await ensureApprover();
    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;
    const reservationId = typeof params?.id === "string" ? params.id : "";

    if (!reservationId) {
      return NextResponse.json({ error: "ID pengajuan tidak valid" }, { status: 400 });
    }

    let action: DecisionAction | null = null;
    try {
      const body = await request.json();
      const raw = typeof body?.action === "string" ? body.action.toUpperCase() : "";
      if (raw === "APPROVE" || raw === "REJECT") {
        action = raw;
      }
    } catch {
      // ignore
    }

    if (!action) {
      return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
    }

    const existing = await prisma.reservation.findUnique({
      where: { res_id: reservationId },
      select: {
        res_id: true,
        res_status: true,
        res_flow: true,
        res_labProgram: true,
        res_labDepartment: true,
        res_processedBy: true,
        res_processedAt: true,
        res_decisionAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (auth.user.role === "KAJUR") {
      if (!auth.user.departmentScope) {
        return NextResponse.json({ error: "Akun Kajur belum memiliki scope jurusan." }, { status: 403 });
      }
      if (!existing.res_labDepartment || existing.res_labDepartment !== auth.user.departmentScope) {
        return NextResponse.json({ error: "Anda tidak berwenang memproses pengajuan jurusan ini." }, { status: 403 });
      }
    }

    if (auth.user.role === "KEPALA_LAB") {
      if (!auth.user.programScope) {
        return NextResponse.json({ error: "Akun Kepala Lab belum memiliki scope prodi." }, { status: 403 });
      }
      if (!existing.res_labProgram || existing.res_labProgram !== auth.user.programScope) {
        return NextResponse.json({ error: "Anda tidak berwenang memproses pengajuan prodi ini." }, { status: 403 });
      }
    }

    const nextStatus = resolveNextStatus({
      currentStatus: existing.res_status,
      role: auth.user.role,
      action,
      flow: existing.res_flow as ReservationFlow,
    });

    if (!nextStatus) {
      return NextResponse.json(
        {
          error: "Status pengajuan sudah berubah atau tidak sesuai tahap role Anda.",
          currentStatus: existing.res_status,
        },
        { status: 409 }
      );
    }

    const processedBy = auth.user.email || auth.user.id;
    const now = new Date();

    const updateData: {
      res_status: string;
      res_processedBy: string;
      res_processedAt: Date;
      res_waitingDekanAt?: Date;
      res_waitingWd2At?: Date;
      res_waitingKajurAt?: Date;
      res_waitingKepalaLabAt?: Date;
      res_decisionAt?: Date;
    } = {
      res_status: nextStatus,
      res_processedBy: processedBy,
      res_processedAt: now,
    };

    const normalizedNext = nextStatus.toUpperCase();
    if (normalizedNext === "PENDING_DEKAN") {
      updateData.res_waitingDekanAt = now;
    }

    if (normalizedNext === "PENDING_WD2" || normalizedNext === "PENDING_WAKIL_DEKAN_2") {
      updateData.res_waitingWd2At = now;
    }

    if (normalizedNext === "PENDING_KAJUR") {
      updateData.res_waitingKajurAt = now;
    }

    if (normalizedNext === "PENDING_KEPALA_LAB") {
      updateData.res_waitingKepalaLabAt = now;
    }

    if (normalizedNext === "APPROVED" || normalizedNext === "DISETUJUI" || normalizedNext.startsWith("REJECT")) {
      updateData.res_decisionAt = now;
    }

    const updateResult = await prisma.reservation.updateMany({
      where: {
        res_id: reservationId,
        res_status: existing.res_status,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: "Pengajuan sudah diproses oleh admin lain. Silakan refresh." },
        { status: 409 }
      );
    }

    const updated = await prisma.reservation.findUnique({
      where: { res_id: reservationId },
      select: {
        res_id: true,
        res_status: true,
        res_processedAt: true,
        res_waitingDekanAt: true,
        res_waitingWd2At: true,
        res_waitingKajurAt: true,
        res_waitingKepalaLabAt: true,
        res_decisionAt: true,
        res_decisionDocumentUrl: true,
        res_labDepartment: true,
        res_labProgram: true,
        user: {
          select: {
            user_id: true,
            name: true,
          },
        },
        room: {
          select: {
            room_name: true,
          },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    let decisionDocumentUrl = updated.res_decisionDocumentUrl;
    if (
      (auth.user.role === "ADMIN_WD2" || auth.user.role === "KEPALA_LAB") &&
      updated.res_status.toUpperCase() === "APPROVED"
    ) {
      try {
        const generated = await generateDecisionLetterForReservation(updated.res_id);
        decisionDocumentUrl = generated.decisionDocumentUrl;
      } catch (error) {
        await prisma.reservation.update({
          where: { res_id: updated.res_id },
          data: {
            res_status: existing.res_status,
            res_processedBy: existing.res_processedBy,
            res_processedAt: existing.res_processedAt,
            res_decisionAt: existing.res_decisionAt,
          },
        });

        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Gagal membuat surat keputusan.",
          },
          { status: 400 },
        );
      }
    }

    // --- Notifications ---
    try {
      const normalizedStatus = updated.res_status.toUpperCase();
      const roomName = updated.room.room_name;
      const userName = updated.user?.name ?? "User";

      // 1. Notify the requesting USER on final decisions (APPROVED / REJECTED)
      if (normalizedStatus === 'APPROVED' && updated.user) {
        await sendNotification(
          updated.user.user_id,
          'RESERVATION_APPROVED',
          'Reservasi Disetujui',
          `Pengajuan Anda untuk ${roomName} telah disetujui`,
          { reservationId: updated.res_id }
        );
      } else if (normalizedStatus.startsWith('REJECTED') && updated.user) {
        await sendNotification(
          updated.user.user_id,
          'RESERVATION_REJECTED',
          'Reservasi Ditolak',
          `Pengajuan Anda untuk ${roomName} telah ditolak`,
          { reservationId: updated.res_id }
        );
      }

      // 2. Cascade: notify next-stage admin(s) when approval progresses
      let nextAdminRole: string | null = null;
      let nextAdminWhere: Record<string, string> = {};

      if (normalizedStatus === 'PENDING_DEKAN') {
        nextAdminRole = 'ADMIN_DEKAN';
        nextAdminWhere = { role: 'ADMIN_DEKAN' };
      } else if (normalizedStatus === 'PENDING_WD2' || normalizedStatus === 'PENDING_WAKIL_DEKAN_2') {
        nextAdminRole = 'ADMIN_WD2';
        nextAdminWhere = { role: 'ADMIN_WD2' };
      } else if (normalizedStatus === 'PENDING_KAJUR') {
        nextAdminRole = 'KAJUR';
        nextAdminWhere = {
          role: 'KAJUR',
          ...(updated.res_labDepartment ? { departmentScope: updated.res_labDepartment } : {}),
        };
      } else if (normalizedStatus === 'PENDING_KEPALA_LAB') {
        nextAdminRole = 'KEPALA_LAB';
        nextAdminWhere = {
          role: 'KEPALA_LAB',
          ...(updated.res_labProgram ? { programScope: updated.res_labProgram } : {}),
        };
      }

      if (nextAdminRole && Object.keys(nextAdminWhere).length > 0) {
        const nextAdmins = await prisma.user.findMany({
          where: nextAdminWhere,
          select: { user_id: true },
        });

        for (const admin of nextAdmins) {
          await sendNotification(
            admin.user_id,
            'RESERVATION_NEW',
            'Pengajuan Menunggu Verifikasi Anda',
            `Pengajuan ${userName} untuk ${roomName} memerlukan persetujuan Anda`,
            { reservationId: updated.res_id }
          );
        }
      }
    } catch (error) {
      console.error('Error sending reservation decision notification:', error);
    }

    return NextResponse.json({
      id: updated.res_id,
      status: updated.res_status,
      processedAt: updated.res_processedAt ? updated.res_processedAt.toISOString() : null,
      waitingDekanAt: updated.res_waitingDekanAt ? updated.res_waitingDekanAt.toISOString() : null,
      waitingWd2At: updated.res_waitingWd2At ? updated.res_waitingWd2At.toISOString() : null,
      waitingKajurAt: updated.res_waitingKajurAt ? updated.res_waitingKajurAt.toISOString() : null,
      waitingKepalaLabAt: updated.res_waitingKepalaLabAt ? updated.res_waitingKepalaLabAt.toISOString() : null,
      decisionAt: updated.res_decisionAt ? updated.res_decisionAt.toISOString() : null,
      decisionDocumentUrl,
    });
  } catch (error) {
    logServerError("[api/admin/reservations/:id/decision] Failed to process decision", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memproses keputusan pengajuan" }, { status: 500 });
  }
}
