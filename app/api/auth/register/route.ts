import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, UserType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, identifier } = body;

    console.log("Registration attempt:", { name, email, userTypeIdentifier: identifier ? "provided" : "not provided" });

    // Validasi input
    if (!name || !email || !password || !confirmPassword || !identifier) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi email format - hanya menerima domain UNSRAT
    const isStudentEmail = email.endsWith("@student.unsrat.ac.id");
    const isStaffEmail = email.endsWith("@unsrat.ac.id");

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

    // Semua user yang mendaftar via form registrasi adalah USER (civitas UNSRAT)
    const userType = UserType.USER;

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
        email: email.toLowerCase(),
        passwordHash,
        identifier,
        userType,
        role: UserRole.USER,
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
