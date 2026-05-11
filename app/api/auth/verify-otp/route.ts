import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { USER_ROLES, USER_TYPES } from "@/lib/user-enums";

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingId, otpCode } = body;

    if (!pendingId || !otpCode) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const trimmedOtp = typeof otpCode === "string" ? otpCode.trim() : "";

    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json(
        { error: "Kode verifikasi harus 6 digit angka" },
        { status: 400 }
      );
    }

    // Cari pending registration
    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Sesi registrasi tidak ditemukan. Silakan daftar ulang." },
        { status: 404 }
      );
    }

    // Cek apakah OTP sudah kadaluarsa
    if (new Date() > pending.expiresAt) {
      return NextResponse.json(
        { error: "Kode verifikasi sudah kadaluarsa. Silakan kirim ulang kode." },
        { status: 410 }
      );
    }

    // Cek apakah percobaan sudah melebihi batas
    if (pending.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan kirim ulang kode verifikasi." },
        { status: 429 }
      );
    }

    // Verifikasi OTP
    const isOtpValid = await bcrypt.compare(trimmedOtp, pending.otpHash);

    if (!isOtpValid) {
      // Increment attempts
      await prisma.pendingRegistration.update({
        where: { id: pendingId },
        data: { attempts: { increment: 1 } },
      });

      const attemptsLeft = MAX_ATTEMPTS - (pending.attempts + 1);
      return NextResponse.json(
        {
          error: attemptsLeft > 0
            ? `Kode verifikasi salah. Sisa percobaan: ${attemptsLeft}`
            : "Terlalu banyak percobaan. Silakan kirim ulang kode verifikasi.",
        },
        { status: 400 }
      );
    }

    // Cek lagi apakah email sudah terdaftar (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: pending.email },
    });

    if (existingUser) {
      // Hapus pending registration
      await prisma.pendingRegistration.delete({ where: { id: pendingId } });
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    // OTP valid → Buat User baru dan hapus PendingRegistration dalam satu transaksi
    const user = await prisma.$transaction(async (tx: typeof prisma) => {
      const newUser = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          passwordHash: pending.passwordHash,
          identifier: pending.identifier,
          userType: USER_TYPES.USER,
          role: USER_ROLES.USER,
        },
      });

      await tx.pendingRegistration.delete({ where: { id: pendingId } });

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verifikasi berhasil! Akun Anda telah dibuat.",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Verify OTP error:", errorMessage);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat verifikasi" },
      { status: 500 }
    );
  }
}
