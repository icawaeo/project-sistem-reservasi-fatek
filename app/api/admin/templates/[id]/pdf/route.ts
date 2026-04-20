import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { ensurePdfPreview, getTemplate } from "@/lib/template-store";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const ensureSuperadmin = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isSuperadminUser(session.user)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const auth = await ensureSuperadmin();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const existing = await getTemplate(id);

    if (!existing) {
      return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
    }

    let template = existing;
    if (!template.pdfStoredPath) {
      try {
        const ensured = await ensurePdfPreview(id);
        if (ensured) {
          template = ensured;
        }
      } catch (error) {
        logServerError("[api/admin/templates/:id/pdf] Failed to ensure PDF preview", error, {
          method: "GET",
          path: "/api/admin/templates/:id/pdf",
          templateId: id,
        });
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Gagal mengonversi template menjadi PDF untuk preview.",
          },
          { status: 500 }
        );
      }
    }

    if (!template.pdfStoredPath) {
      return NextResponse.json({ error: "Preview PDF tidak tersedia." }, { status: 404 });
    }

    const absolutePath = path.join(process.cwd(), template.pdfStoredPath);

    let body: ArrayBuffer;
    try {
      const fileBuffer = await fs.readFile(absolutePath);
      body = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
    } catch (error) {
      logServerError("[api/admin/templates/:id/pdf] PDF preview file not found", error, {
        method: "GET",
        path: "/api/admin/templates/:id/pdf",
        templateId: id,
        storedPath: template.pdfStoredPath,
      });
      return NextResponse.json({ error: "File preview tidak ditemukan." }, { status: 404 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": template.pdfMimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${template.pdfStoredFilename ?? "template.pdf"}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logServerError("[api/admin/templates/:id/pdf] Failed to serve template PDF preview", error, {
      method: "GET",
      path: "/api/admin/templates/:id/pdf",
    });
    return NextResponse.json({ error: "Gagal memuat preview template." }, { status: 500 });
  }
}
