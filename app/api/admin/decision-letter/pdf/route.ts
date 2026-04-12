import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { ensurePdfPreview, listTemplates } from "@/lib/template-store";

export const runtime = "nodejs";

const isAdminLikeRole = (role: unknown) => {
  return role === "ADMIN" || role === "ADMIN_DEKAN" || role === "ADMIN_WD2" || role === "SUPERADMIN";
};

const ensureAdminAccess = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (isAdminLikeRole((session.user as any)?.role) || isSuperadminUser(session.user)) {
    return { ok: true as const };
  }

  return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
};

export async function GET() {
  const auth = await ensureAdminAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const templates = await listTemplates();
  const active = templates.find((item) => item.isActive) ?? templates[0] ?? null;

  if (!active) {
    return NextResponse.json({ error: "Template surat keputusan belum tersedia." }, { status: 404 });
  }

  let template = active;
  if (!template.pdfStoredPath) {
    try {
      const ensured = await ensurePdfPreview(template.id);
      if (ensured) {
        template = ensured;
      }
    } catch (error) {
      console.error("[api/admin/decision-letter/pdf] Failed to ensure PDF preview", {
        templateId: template.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Gagal menyiapkan preview surat keputusan.",
        },
        { status: 500 }
      );
    }
  }

  if (!template.pdfStoredPath) {
    return NextResponse.json({ error: "Preview surat keputusan tidak tersedia." }, { status: 404 });
  }

  const absolutePath = path.join(process.cwd(), template.pdfStoredPath);

  let body: ArrayBuffer;
  try {
    const fileBuffer = await fs.readFile(absolutePath);
    body = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  } catch {
    return NextResponse.json({ error: "File preview surat keputusan tidak ditemukan." }, { status: 404 });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": template.pdfMimeType || "application/pdf",
      "Content-Disposition": `inline; filename="${template.pdfStoredFilename ?? "surat_keputusan.pdf"}"`,
      "Cache-Control": "no-store",
    },
  });
}
