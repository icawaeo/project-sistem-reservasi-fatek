import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmailChangeToken, EMAIL_CHANGE_TOKEN_TTL_MS } from "@/lib/email-change";
import { sendEmailChangeVerificationMail } from "@/lib/mail";

export const runtime = "nodejs";

const isValidEmail = (value: string) => {
	const email = value.trim();
	if (!email) return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const resolveBaseUrl = (request: Request) => {
	const configured = process.env.NEXTAUTH_URL;
	if (configured) {
		return configured.replace(/\/$/, "");
	}

	const url = new URL(request.url);
	const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
	const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
	return `${proto}://${host}`;
};

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json().catch(() => null);
		const newEmailRaw = typeof body?.email === "string" ? body.email : "";
		const newEmail = newEmailRaw.trim().toLowerCase();

		if (!isValidEmail(newEmail)) {
			return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
		}

		const currentUser = await prisma.user.findUnique({
			where: { user_id: session.user.id },
			select: { email: true, name: true },
		});

		if (!currentUser) {
			return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
		}

		if (newEmail === currentUser.email.toLowerCase()) {
			return NextResponse.json({ success: true, delivered: true });
		}

		const emailOwner = await prisma.user.findUnique({
			where: { email: newEmail },
			select: { user_id: true },
		});

		if (emailOwner) {
			return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
		}

		const { token, tokenHash, expiresAt } = generateEmailChangeToken();
		const baseUrl = resolveBaseUrl(request);
		const verificationUrl = `${baseUrl}/api/admin/profile/verify-email-change?token=${encodeURIComponent(token)}`;

		await prisma.$transaction([
			prisma.emailChangeToken.deleteMany({
				where: {
					userId: session.user.id,
					usedAt: null,
				},
			}),
			prisma.emailChangeToken.create({
				data: {
					tokenHash,
					userId: session.user.id,
					newEmail,
					expiresAt,
				},
			}),
		]);

		const expiresInHours = Math.max(1, Math.round(EMAIL_CHANGE_TOKEN_TTL_MS / (1000 * 60 * 60)));
		const result = await sendEmailChangeVerificationMail({
			to: newEmail,
			userName: currentUser.name,
			verificationUrl,
			expiresInHours,
		});

		return NextResponse.json({ success: true, delivered: result.delivered });
	} catch {
		return NextResponse.json({ error: "Gagal mengirim email verifikasi" }, { status: 500 });
	}
}
