import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const resolveExtension = (mime: string) => {
	switch (mime) {
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
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const role = (session.user.role || "").toUpperCase();
		if (role !== "ADMIN_DEKAN" && role !== "ADMIN_WD2") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
			return NextResponse.json({ error: "Ukuran file terlalu besar (maks 2MB)" }, { status: 400 });
		}

		const extension = resolveExtension(file.type);
		if (!extension) {
			return NextResponse.json({ error: "Format file harus PNG/JPG/WEBP" }, { status: 400 });
		}

		const bytes = Buffer.from(await file.arrayBuffer());
		const fileName = `${session.user.id}-${Date.now()}${extension}`;
		const uploadDir = path.join(process.cwd(), "public", "uploads", "signatures");
		await mkdir(uploadDir, { recursive: true });

		const destination = path.join(uploadDir, fileName);
		await writeFile(destination, bytes);

		const signatureUrl = `/uploads/signatures/${fileName}`;

		await prisma.user.update({
			where: { user_id: session.user.id },
			data: { signatureUrl },
		});

		return NextResponse.json({ success: true, signatureUrl });
	} catch {
		return NextResponse.json({ error: "Gagal mengupload TTD" }, { status: 500 });
	}
}
