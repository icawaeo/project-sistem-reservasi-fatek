import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const resolveExtension = (mime: string) => {
  switch (mime) {
    case "application/pdf":
      return ".pdf";
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return null;
  }
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File kosong" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Ukuran file terlalu besar (maks 5MB)" }, { status: 400 });
    }

    const extension = resolveExtension(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Format file harus PDF/JPG/PNG/WEBP" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeId = String(session.user.id).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `reservation-${safeId}-${Date.now()}-${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reservations");
    await mkdir(uploadDir, { recursive: true });

    const destination = path.join(uploadDir, fileName);
    await writeFile(destination, bytes);

    const documentUrl = `/uploads/reservations/${fileName}`;

    return NextResponse.json({ success: true, documentUrl });
  } catch {
    return NextResponse.json({ error: "Gagal mengupload dokumen" }, { status: 500 });
  }
}
