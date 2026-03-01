import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, identifier } = body;

    // Validasi input
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
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

    // Klasifikasi user berdasarkan email domain
    let userType: UserType;
    if (email.endsWith("@student.unsrat.ac.id")) {
      userType = UserType.STUDENT;
    } else if (email.endsWith("@unsrat.ac.id")) {
      userType = UserType.STAFF;
    } else {
      userType = UserType.PUBLIC;
    }

    // Validasi identifier wajib untuk STUDENT dan STAFF
    if ((userType === UserType.STUDENT || userType === UserType.STAFF) && !identifier) {
      return NextResponse.json(
        { error: "NIM/NIP wajib diisi untuk mahasiswa dan staff" },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        identifier: identifier || null,
        userType,
      },
    });

    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          userType: user.userType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Register error:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}
