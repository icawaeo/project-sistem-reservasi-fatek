import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { ensurePdfPreview, getActiveTemplateByType, type DecisionLetterTemplateType } from "@/lib/template-store";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

const isAdminLikeRole = (role: unknown) => {
  return (
    role === "ADMIN" ||
    role === "ADMIN_DEKAN" ||
    role === "ADMIN_WD2" ||
    role === "KAJUR" ||
    role === "KEPALA_LAB" ||
    role === "SUPERADMIN"
  );
};

const ensureAdminAccess = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (isAdminLikeRole(session.user.role) || isSuperadminUser(session.user)) {
    return { ok: true as const };
  }

  return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
};

export async function GET(request: Request) {
  try {
    const auth = await ensureAdminAccess();
    if (!auth.ok) {
      return auth.response;
    }

  // Default behavior: show GENERAL preview.
  // If reservationId is provided, select template type based on reservation flow.
  let templateType: DecisionLetterTemplateType = "GENERAL";

  const { searchParams } = new URL(request.url);

  const flowParam = searchParams.get("flow");
  if (flowParam === "GENERAL" || flowParam === "LAB_SKRIPSI" || flowParam === "LAB_LAINNYA") {
    templateType = flowParam;
  } else {
    const reservationId = searchParams.get("reservationId");
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { res_id: reservationId },
        select: { res_flow: true },
      });

      if (!reservation) {
        return NextResponse.json({ error: "Reservasi tidak ditemukan." }, { status: 404 });
      }

      const flow = reservation.res_flow;
      templateType =
        flow === "LAB_SKRIPSI" || flow === "LAB_LAINNYA" || flow === "GENERAL" ? (flow as DecisionLetterTemplateType) : "GENERAL";
    }
  }

  const active = await getActiveTemplateByType(templateType);

  if (!active) {
    const label =
      templateType === "LAB_SKRIPSI"
        ? "Lab (Skripsi)"
        : templateType === "LAB_LAINNYA"
          ? "Lab (Lainnya)"
          : "Umum";
    return NextResponse.json({ error: `Template surat keputusan (${label}) belum tersedia.` }, { status: 404 });
  }

  let template = active;
    if (!template.pdfStoredPath) {
      try {
        const ensured = await ensurePdfPreview(template.id);
        if (ensured) {
          template = ensured;
        }
      } catch (error) {
        logServerError("[api/admin/decision-letter/pdf] Failed to ensure PDF preview", error, {
          ...getRequestLogMeta(request),
          templateId: template.id,
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
    } catch (error) {
      logServerError("[api/admin/decision-letter/pdf] PDF preview file not found", error, {
        ...getRequestLogMeta(request),
        templateId: template.id,
        storedPath: template.pdfStoredPath,
      });
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
  } catch (error) {
    logServerError("[api/admin/decision-letter/pdf] Failed to serve decision letter PDF preview", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memuat preview surat keputusan." }, { status: 500 });
  }
}
