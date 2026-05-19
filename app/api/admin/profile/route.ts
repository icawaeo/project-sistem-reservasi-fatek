import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json().catch(() => null);
		const name = typeof body?.name === "string" ? body.name.trim() : "";
		const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
		const rank = typeof body?.rank === "string" ? body.rank.trim() : "";
		const position = typeof body?.position === "string" ? body.position.trim() : "";

		if (!name) {
			return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
		}

		if (name.length < 2) {
			return NextResponse.json({ error: "Nama terlalu pendek" }, { status: 400 });
		}

		const dbUser = await prisma.user.findUnique({
			where: { user_id: session.user.id },
			select: { role: true },
		});

		const role = (dbUser?.role ?? session.user.role ?? "").toUpperCase();
		const requiresOfficialProfile =
			role === "ADMIN_DEKAN" ||
			role === "ADMIN_WD2" ||
			role === "KAJUR" ||
			role === "KEPALA_LAB";

		if (requiresOfficialProfile && (!identifier || !rank || !position)) {
			return NextResponse.json(
				{ error: "NIP, pangkat/golongan, dan jabatan wajib diisi untuk pejabat penandatangan." },
				{ status: 400 },
			);
		}

		await prisma.user.update({
			where: {
				user_id: session.user.id,
			},
			data: {
				name,
				...(requiresOfficialProfile
					? {
							identifier,
							rank,
							position,
						}
					: {}),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		logServerError("[api/admin/profile] Failed to update profile", error, getRequestLogMeta(request));
		return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
	}
}
