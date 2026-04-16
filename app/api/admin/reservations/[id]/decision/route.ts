import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      if (current === "PENDING" || current === "PENDING_KABAG") return "REJECTED_KABAG";
      return null;
    }

    if (role === "ADMIN_DEKAN") {
      if (current === "PENDING_DEKAN") return "REJECTED_DEKAN";
      return null;
    }

    if (role === "ADMIN_WD2") {
      if (current === "PENDING_WD2" || current === "PENDING_WAKIL_DEKAN_2") return "REJECTED_WD2";
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
      res_status: true,
      res_processedAt: true,
      res_waitingDekanAt: true,
      res_waitingWd2At: true,
      res_waitingKajurAt: true,
      res_waitingKepalaLabAt: true,
      res_decisionAt: true,
    },
  });

  if (!updated) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    id: reservationId,
    status: updated.res_status,
    processedAt: updated.res_processedAt ? updated.res_processedAt.toISOString() : null,
    waitingDekanAt: updated.res_waitingDekanAt ? updated.res_waitingDekanAt.toISOString() : null,
    waitingWd2At: updated.res_waitingWd2At ? updated.res_waitingWd2At.toISOString() : null,
    waitingKajurAt: updated.res_waitingKajurAt ? updated.res_waitingKajurAt.toISOString() : null,
    waitingKepalaLabAt: updated.res_waitingKepalaLabAt ? updated.res_waitingKepalaLabAt.toISOString() : null,
    decisionAt: updated.res_decisionAt ? updated.res_decisionAt.toISOString() : null,
  });
}
