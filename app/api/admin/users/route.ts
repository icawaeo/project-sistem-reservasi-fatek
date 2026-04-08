import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, UserRole, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { generatePasswordSetupToken, PASSWORD_SETUP_TOKEN_TTL_MS } from "@/lib/password-setup";
import { sendPasswordSetupMail } from "@/lib/mail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

const mapUserCategoryToType = (value: unknown): UserType => {
  if (value === "unsrat") {
    return UserType.STAFF;
  }

  return UserType.PUBLIC;
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
  userType: UserType;
  role: UserRole;
  createdAt: Date;
  passwordSetupTokens?: Array<{ createdAt: Date; usedAt: Date | null }>;
}) => ({
  id: user.user_id,
  name: user.name,
  email: user.email,
  userCategory: user.userType === UserType.PUBLIC ? "umum" : "unsrat",
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
  } catch {
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
    const userType = mapUserCategoryToType(body?.userCategory);
    const role = parseRole(body?.role);
    const { token, tokenHash, expiresAt } = generatePasswordSetupToken();

    if (!name || !email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Data user belum valid" }, { status: 400 });
    }

    const placeholderPasswordHash = await bcrypt.hash(`pending-${Date.now()}-${email}`, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        userType,
        role,
        passwordHash: placeholderPasswordHash,
        identifier: null,
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
      console.error("MAIL_DEBUG: gagal kirim email setup password", mailError);
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    return NextResponse.json({ error: "Gagal menambahkan user" }, { status: 500 });
  }
}
