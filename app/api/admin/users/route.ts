import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { USER_ROLES, USER_TYPES, type UserRoleValue, type UserTypeValue } from "@/lib/user-enums";
import { LAB_PROGRAM_VALUES, type LabDepartmentValue, type LabProgramValue } from "@/lib/lab-enums";
import { generatePasswordSetupToken, PASSWORD_SETUP_TOKEN_TTL_MS } from "@/lib/password-setup";
import { sendPasswordSetupMail } from "@/lib/mail";
import { getRequestLogMeta, logServerError, logServerWarn } from "@/lib/server-logger";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;



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

const buildBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXTAUTH_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
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

export async function GET() {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(users.map(mapUser));
  } catch (error) {
    logServerError("[api/admin/users] Failed to fetch users", error, {
      method: "GET",
      path: "/api/admin/users",
    });
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = parseRole(body?.role);
    const departmentScope = role === USER_ROLES.KAJUR ? parseDepartmentScope(body?.departmentScope) : null;
    const programScope =
      role === USER_ROLES.KAPRODI || role === USER_ROLES.KEPALA_LAB ? parseProgramScope(body?.programScope) : null;
    const userType = role === USER_ROLES.USER ? USER_TYPES.USER : USER_TYPES.STAFF;
    const { token, tokenHash, expiresAt } = generatePasswordSetupToken();

    if (!name || !email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Data user belum valid" }, { status: 400 });
    }

    if (role === USER_ROLES.KAJUR && !departmentScope) {
      return NextResponse.json({ error: "Scope jurusan wajib dipilih untuk Kajur." }, { status: 400 });
    }

    if ((role === USER_ROLES.KAPRODI || role === USER_ROLES.KEPALA_LAB) && !programScope) {
      return NextResponse.json({ error: "Scope program studi wajib dipilih untuk role ini." }, { status: 400 });
    }

    const placeholderPasswordHash = await bcrypt.hash(`pending-${Date.now()}-${email}`, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        userType,
        role,
        departmentScope,
        programScope,
        passwordHash: placeholderPasswordHash,
        identifier: null,
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

    await prisma.passwordSetupToken.deleteMany({
      where: {
        userId: user.user_id,
        usedAt: null,
      },
    });

    await prisma.passwordSetupToken.create({
      data: {
        tokenHash,
        userId: user.user_id,
        expiresAt,
      },
    });

    const setupUrl = `${buildBaseUrl(request)}/set-password?token=${token}`;
    const expiresInHours = Math.floor(PASSWORD_SETUP_TOKEN_TTL_MS / (1000 * 60 * 60));

    let inviteEmailSent = false;

    try {
      const mailResult = await sendPasswordSetupMail({
        to: user.email,
        userName: user.name,
        setupUrl,
        expiresInHours,
      });

      inviteEmailSent = mailResult.delivered;
    } catch (mailError) {
      logServerError("[api/admin/users] Failed to send password setup mail", mailError, {
        ...getRequestLogMeta(request),
        createdUserId: user.user_id,
      });
      inviteEmailSent = false;
    }

    return NextResponse.json(
      {
        user: {
          ...mapUser(user),
          isVerified: false,
          resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
        },
        inviteEmailSent,
        setupUrl: inviteEmailSent ? null : setupUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      logServerWarn("[api/admin/users] Duplicate email during create", {
        ...getRequestLogMeta(request),
        code: error.code,
      });
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    logServerError("[api/admin/users] Failed to create user", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menambahkan user" }, { status: 500 });
  }
}
