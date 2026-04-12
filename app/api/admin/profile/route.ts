import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json().catch(() => null);
		const name = typeof body?.name === "string" ? body.name.trim() : "";

		if (!name) {
			return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
		}

		if (name.length < 2) {
			return NextResponse.json({ error: "Nama terlalu pendek" }, { status: 400 });
		}

		await prisma.user.update({
			where: {
				user_id: session.user.id,
			},
			data: {
				name,
			},
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
	}
}
