import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DecisionAction = "APPROVE" | "REJECT";

type SessionUser = {
  id: string;
  role: string;
  email?: string | null;
};

const normalizeRole = (role: string | null | undefined) => (role ?? "").toUpperCase();

const resolveNextStatus = (params: { currentStatus: string; role: string; action: DecisionAction }) => {
  const current = params.currentStatus.toUpperCase();
  const role = params.role.toUpperCase();

  if (params.action === "APPROVE") {
    if (role === "ADMIN") {
      if (current === "PENDING" || current === "PENDING_KABAG") return "PENDING_DEKAN";
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

    return null;
  }

  return null;
};

const ensureAdmin = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user as SessionUser;
  const role = normalizeRole(user.role);

  if (role !== "ADMIN" && role !== "ADMIN_DEKAN" && role !== "ADMIN_WD2") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, user: { id: user.id, role, email: user.email ?? null } };
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
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
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  const nextStatus = resolveNextStatus({
    currentStatus: existing.res_status,
    role: auth.user.role,
    action,
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

  const updateResult = await prisma.reservation.updateMany({
    where: {
      res_id: reservationId,
      res_status: existing.res_status,
    },
    data: {
      res_status: nextStatus,
      res_processedBy: processedBy,
      res_processedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return NextResponse.json(
      { error: "Pengajuan sudah diproses oleh admin lain. Silakan refresh." },
      { status: 409 }
    );
  }

  return NextResponse.json({ id: reservationId, status: nextStatus });
}
