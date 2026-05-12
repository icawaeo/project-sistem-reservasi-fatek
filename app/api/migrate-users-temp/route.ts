import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$executeRaw`UPDATE "User" SET "userType" = 'USER'::"UserType" WHERE "userType" IN ('STUDENT', 'PUBLIC')`;
    return NextResponse.json({ 
      success: true, 
      message: `Berhasil memigrasi ${result} user menjadi USER` 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
