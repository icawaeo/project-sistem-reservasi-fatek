import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashPasswordSetupToken } from "@/lib/password-setup";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import { getPostLoginRedirectPath } from "@/lib/admin-access";

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const getValidToken = async (rawToken: unknown) => {
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  if (!token) {
    return null;
  }

  const tokenHash = hashPasswordSetupToken(token);

  return prisma.passwordSetupToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const record = await getValidToken(url.searchParams.get("token"));

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      email: record.user.email,
      name: record.user.name,
    });
  } catch (error) {
    logServerError("[api/auth/set-password] Failed to validate password setup token", error, getRequestLogMeta(request));
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Kata sandi tidak sesuai" }, { status: 400 });
    }

    if (!PASSWORD_RULES.test(password)) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka" },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordSetupToken(token);
    const existing = await prisma.passwordSetupToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            userType: true,
            role: true,
          },
        },
      },
    });

    if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          user_id: existing.userId,
        },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordSetupToken.update({
        where: {
          id: existing.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      email: existing.user.email,
      redirectTo: getPostLoginRedirectPath(existing.user),
    });
  } catch (error) {
    logServerError("[api/auth/set-password] Failed to set password", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menyimpan password" }, { status: 500 });
  }
}
