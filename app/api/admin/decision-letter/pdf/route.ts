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

const isReservationOwner = async (reservationId: string, userId: string) => {
  const reservation = await prisma.reservation.findFirst({
    where: {
      res_id: reservationId,
      user_id: userId,
    },
    select: {
      res_flow: true,
      res_status: true,
      res_decisionDocumentUrl: true,
    },
  });

  return reservation;
};

const ensureDecisionLetterAccess = async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (isAdminLikeRole(session.user.role) || isSuperadminUser(session.user)) {
    return { ok: true as const };
  }

  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get("reservationId") ?? "";

  if (!reservationId) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const reservation = await isReservationOwner(reservationId, session.user.id);

  if (!reservation) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
};

export async function GET(request: Request) {
  try {
    const auth = await ensureDecisionLetterAccess(request);
    if (!auth.ok) {
      return auth.response;
    }

  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get("reservationId");

  if (reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { res_id: reservationId },
      select: {
        res_decisionDocumentUrl: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservasi tidak ditemukan." }, { status: 404 });
    }

    if (!reservation.res_decisionDocumentUrl) {
      return NextResponse.json({ error: "Surat keputusan belum tersedia." }, { status: 404 });
    }

    const normalizedRelativePath = reservation.res_decisionDocumentUrl.replace(/^\/+/, "");
    const absoluteDecisionPath = path.join(process.cwd(), "public", normalizedRelativePath.replace(/^uploads\//, "uploads/"));

    let body: ArrayBuffer;
    try {
      const fileBuffer = await fs.readFile(absoluteDecisionPath);
      body = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
    } catch (error) {
      logServerError("[api/admin/decision-letter/pdf] Decision letter file not found", error, {
        ...getRequestLogMeta(request),
        reservationId,
        decisionDocumentUrl: reservation.res_decisionDocumentUrl,
      });
      return NextResponse.json({ error: "File surat keputusan tidak ditemukan." }, { status: 404 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="surat_keputusan_${reservationId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Default behavior without reservationId: show template preview.
  let templateType: DecisionLetterTemplateType = "GENERAL";

  const flowParam = searchParams.get("flow");
  if (flowParam === "GENERAL" || flowParam === "LAB_SKRIPSI" || flowParam === "LAB_LAINNYA") {
    templateType = flowParam;
  } else {
    templateType = "GENERAL";
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
