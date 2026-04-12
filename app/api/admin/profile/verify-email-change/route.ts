import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashEmailChangeToken } from "@/lib/email-change";

export const runtime = "nodejs";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token")?.trim() ?? "";

	if (!token) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	try {
		const tokenHash = hashEmailChangeToken(token);

		const record = await prisma.emailChangeToken.findUnique({
			where: { tokenHash },
			select: {
				id: true,
				userId: true,
				newEmail: true,
				expiresAt: true,
				usedAt: true,
			},
		});

		if (!record || record.usedAt || record.expiresAt < new Date()) {
			return NextResponse.redirect(new URL("/auth", request.url));
		}

		const emailOwner = await prisma.user.findUnique({
			where: { email: record.newEmail },
			select: { user_id: true },
		});

		if (emailOwner && emailOwner.user_id !== record.userId) {
			return NextResponse.redirect(new URL("/auth", request.url));
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { user_id: record.userId },
				data: { email: record.newEmail },
			}),
			prisma.emailChangeToken.update({
				where: { id: record.id },
				data: { usedAt: new Date() },
			}),
		]);

		return NextResponse.redirect(new URL("/administrator/profile?emailChanged=1", request.url));
	} catch {
		return NextResponse.redirect(new URL("/auth", request.url));
	}
}
