import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, UserRole, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { getRequestLogMeta, logServerError, logServerWarn } from "@/lib/server-logger";

const RESEND_COOLDOWN_SECONDS = 60;

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};



const parseRole = (value: unknown): UserRole => {
  if (
    value === UserRole.ADMIN ||
    value === UserRole.ADMIN_DEKAN ||
    value === UserRole.ADMIN_WD2 ||
    value === UserRole.SUPERADMIN
  ) {
    return value;
  }

  return UserRole.USER;
};

const getResendCooldownSeconds = (tokens: Array<{ createdAt: Date; usedAt: Date | null }>) => {
  const latestToken = tokens
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  if (!latestToken) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - latestToken.createdAt.getTime()) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

const mapUser = (user: {
  user_id: string;
  name: string;
  email: string;
  userType: UserType;
  role: UserRole;
  createdAt: Date;
  passwordSetupTokens?: Array<{ createdAt: Date; usedAt: Date | null }>;
}) => ({
  id: user.user_id,
  name: user.name,
  email: user.email,

  role: user.role,
  createdAt: user.createdAt.toISOString(),
  isVerified: (user.passwordSetupTokens ?? []).every((token) => token.usedAt !== null),
  resendCooldownSeconds: getResendCooldownSeconds(user.passwordSetupTokens ?? []),
});

const authorize = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperadminUser(session.user)) {
    return null;
  }

  return session;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID user tidak valid" }, { status: 400 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role = parseRole(body?.role);

    if (!name) {
      return NextResponse.json({ error: "Data user belum valid" }, { status: 400 });
    }

    if (session.user.id === id && role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: "Anda tidak dapat menurunkan role akun sendiri dari superadmin" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        user_id: id,
      },
      data: {
        name,
        role,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        userType: true,
        role: true,
        createdAt: true,
        passwordSetupTokens: {
          select: {
            createdAt: true,
            usedAt: true,
          },
        },
      },
    });

    return NextResponse.json(mapUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      logServerWarn("[api/admin/users/:id] User not found during update", {
        ...getRequestLogMeta(request),
        code: error.code,
      });
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    logServerError("[api/admin/users/:id] Failed to update user", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID user tidak valid" }, { status: 400 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: "Akun yang sedang dipakai tidak bisa dihapus" }, { status: 400 });
    }

    const reservationsCount = await prisma.reservation.count({
      where: {
        user_id: id,
      },
    });

    if (reservationsCount > 0) {
      return NextResponse.json(
        { error: "User tidak dapat dihapus karena memiliki riwayat reservasi" },
        { status: 409 }
      );
    }

    await prisma.user.delete({
      where: {
        user_id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      logServerWarn("[api/admin/users/:id] User not found during delete", {
        ...getRequestLogMeta(request),
        code: error.code,
      });
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    logServerError("[api/admin/users/:id] Failed to delete user", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
