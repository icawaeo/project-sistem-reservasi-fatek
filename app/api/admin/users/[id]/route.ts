import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { USER_ROLES, USER_TYPES, type UserRoleValue, type UserTypeValue } from "@/lib/user-enums";
import { LAB_PROGRAM_VALUES, type LabDepartmentValue, type LabProgramValue } from "@/lib/lab-enums";
import { getRequestLogMeta, logServerError, logServerWarn } from "@/lib/server-logger";
import { activeReservationWhere } from "@/lib/reservation-lifecycle";

const RESEND_COOLDOWN_SECONDS = 60;

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};



const parseRole = (value: unknown): UserRoleValue => {
  if (
    value === USER_ROLES.USER ||
    value === USER_ROLES.ADMIN ||
    value === USER_ROLES.ADMIN_DEKAN ||
    value === USER_ROLES.ADMIN_WD2 ||
    value === USER_ROLES.KAJUR ||
    value === USER_ROLES.KAPRODI ||
    value === USER_ROLES.KEPALA_LAB ||
    value === USER_ROLES.SUPERADMIN
  ) {
    return value;
  }

  return USER_ROLES.USER;
};

const LAB_DEPARTMENT_VALUES = ["ELEKTRO", "ARSITEKTUR", "SIPIL", "MESIN"] as const;

const parseDepartmentScope = (value: unknown): LabDepartmentValue | null =>
  typeof value === "string" && LAB_DEPARTMENT_VALUES.includes(value as LabDepartmentValue)
    ? (value as LabDepartmentValue)
    : null;

const parseProgramScope = (value: unknown): LabProgramValue | null =>
  typeof value === "string" && LAB_PROGRAM_VALUES.includes(value as LabProgramValue)
    ? (value as LabProgramValue)
    : null;

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
  userType: UserTypeValue;
  role: UserRoleValue;
  departmentScope: LabDepartmentValue | null;
  programScope: LabProgramValue | null;
  createdAt: Date;
  passwordSetupTokens?: Array<{ createdAt: Date; usedAt: Date | null }>;
}) => ({
  id: user.user_id,
  name: user.name,
  email: user.email,

  role: user.role,
  departmentScope: user.departmentScope,
  programScope: user.programScope,
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
    const departmentScope = role === USER_ROLES.KAJUR ? parseDepartmentScope(body?.departmentScope) : null;
    const programScope =
      role === USER_ROLES.KAPRODI || role === USER_ROLES.KEPALA_LAB ? parseProgramScope(body?.programScope) : null;

    if (!name) {
      return NextResponse.json({ error: "Data user belum valid" }, { status: 400 });
    }

    if (role === USER_ROLES.KAJUR && !departmentScope) {
      return NextResponse.json({ error: "Scope jurusan wajib dipilih untuk Kajur." }, { status: 400 });
    }

    if ((role === USER_ROLES.KAPRODI || role === USER_ROLES.KEPALA_LAB) && !programScope) {
      return NextResponse.json({ error: "Scope program studi wajib dipilih untuk role ini." }, { status: 400 });
    }

    if (session.user.id === id && role !== USER_ROLES.SUPERADMIN) {
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
        departmentScope,
        programScope,
        userType: role === USER_ROLES.USER ? USER_TYPES.USER : USER_TYPES.STAFF,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        userType: true,
        role: true,
        departmentScope: true,
        programScope: true,
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
    if (isPrismaKnownRequestError(error) && error.code === "P2025") {
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

    const activeReservationsCount = await prisma.reservation.count({
      where: {
        user_id: id,
        ...activeReservationWhere(),
      },
    });

    if (activeReservationsCount > 0) {
      return NextResponse.json(
        { error: "User tidak dapat dihapus karena memiliki reservasi aktif atau dalam proses approval" },
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
    if (isPrismaKnownRequestError(error) && error.code === "P2025") {
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
