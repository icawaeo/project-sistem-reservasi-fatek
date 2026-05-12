import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendRegistrationOtpMail } from "@/lib/mail";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const generateOtp = (): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, identifier } = body;

    // Validasi input
    if (!name || !email || !password || !confirmPassword || !identifier) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi email format - hanya menerima domain UNSRAT
    const normalizedEmail = email.toLowerCase().trim();
    const isStudentEmail = normalizedEmail.endsWith("@student.unsrat.ac.id");
    const isStaffEmail = normalizedEmail.endsWith("@unsrat.ac.id");

    if (!isStudentEmail && !isStaffEmail) {
      return NextResponse.json(
        { error: "Hanya email UNSRAT (@unsrat.ac.id atau @student.unsrat.ac.id) yang dapat digunakan untuk mendaftar" },
        { status: 400 }
      );
    }

    // Validasi password minimal 8 karakter
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Validasi password dan konfirmasi password sama
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak sama" },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar sebagai User aktif
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert PendingRegistration (jika email sudah ada di pending, update)
    const pending = await prisma.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      create: {
        name: name.trim(),
        email: normalizedEmail,
        identifier: identifier.trim(),
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      update: {
        name: name.trim(),
        identifier: identifier.trim(),
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
    });

    // Kirim OTP via email
    const mailResult = await sendRegistrationOtpMail({
      to: normalizedEmail,
      userName: name.trim(),
      otpCode,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    if (!mailResult.delivered) {
      console.warn("REGISTER_DEBUG: Email OTP tidak terkirim. OTP:", otpCode);
    }

    return NextResponse.json(
      {
        message: "Kode verifikasi telah dikirim ke email Anda",
        pendingId: pending.id,
        maskedEmail: maskEmail(normalizedEmail),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Register error:", errorMessage);
    console.error("Full error:", error);

    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { error: `Error: ${errorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}
