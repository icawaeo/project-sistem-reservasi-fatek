import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { generatePasswordSetupToken, PASSWORD_SETUP_TOKEN_TTL_MS } from "@/lib/password-setup";
import { sendPasswordSetupMail } from "@/lib/mail";

const RESEND_COOLDOWN_SECONDS = 60;

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const authorize = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperadminUser(session.user)) {
    return null;
  }

  return session;
};

const buildBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXTAUTH_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID user tidak valid" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        user_id: id,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        passwordSetupTokens: {
          select: {
            usedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isVerified = user.passwordSetupTokens.every((token) => token.usedAt !== null);

    if (isVerified) {
      return NextResponse.json({ error: "Akun sudah terverifikasi" }, { status: 400 });
    }

    const latestToken = user.passwordSetupTokens
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (latestToken) {
      const elapsedSeconds = Math.floor((Date.now() - latestToken.createdAt.getTime()) / 1000);
      const retryAfterSeconds = RESEND_COOLDOWN_SECONDS - elapsedSeconds;

      if (retryAfterSeconds > 0) {
        return NextResponse.json(
          {
            error: "Link verifikasi baru bisa dikirim lagi dalam 1 menit",
            retryAfterSeconds,
          },
          { status: 429 }
        );
      }
    }

    const { token, tokenHash, expiresAt } = generatePasswordSetupToken();

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
      console.error("MAIL_DEBUG: gagal kirim ulang email setup password", mailError);
      inviteEmailSent = false;
    }

    return NextResponse.json({
      inviteEmailSent,
      setupUrl: inviteEmailSent ? null : setupUrl,
      retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengirim link verifikasi" }, { status: 500 });
  }
}
