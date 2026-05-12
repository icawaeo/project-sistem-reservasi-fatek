import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendRegistrationOtpMail } from "@/lib/mail";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = (): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingId } = body;

    if (!pendingId) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Sesi registrasi tidak ditemukan. Silakan daftar ulang." },
        { status: 404 }
      );
    }

    // Rate-limit: cek cooldown
    const secondsSinceLastSent = (Date.now() - pending.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSent);
      return NextResponse.json(
        { error: `Tunggu ${waitSeconds} detik sebelum mengirim ulang kode.` },
        { status: 429 }
      );
    }

    // Generate OTP baru
    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update pending registration
    await prisma.pendingRegistration.update({
      where: { id: pendingId },
      data: {
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
    });

    // Kirim OTP via email
    const mailResult = await sendRegistrationOtpMail({
      to: pending.email,
      userName: pending.name,
      otpCode,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    if (!mailResult.delivered) {
      console.warn("RESEND_OTP_DEBUG: Email OTP tidak terkirim. OTP:", otpCode);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Kode verifikasi baru telah dikirim ke email Anda.",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Resend OTP error:", errorMessage);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim ulang kode" },
      { status: 500 }
    );
  }
}
