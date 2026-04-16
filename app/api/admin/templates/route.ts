import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { createTemplateFromDocx, listTemplates, type DecisionLetterTemplateType } from "@/lib/template-store";

export const runtime = "nodejs";

const ensureSuperadmin = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isSuperadminUser(session.user)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, user: session.user };
};

const toSummary = (template: Awaited<ReturnType<typeof listTemplates>>[number]) => ({
  id: template.id,
  templateType: template.templateType,
  name: template.name,
  originalFilename: template.originalFilename,
  pdfOriginalFilename: template.pdfOriginalFilename ?? null,
  hasPdfPreview: Boolean(template.pdfStoredPath),
  fileSize: template.fileSize,
  isActive: template.isActive,
  placeholders: template.placeholders,
  updatedAt: template.updatedAt,
  createdAt: template.createdAt,
});

export async function GET() {
  const auth = await ensureSuperadmin();
  if (!auth.ok) {
    return auth.response;
  }

  const templates = await listTemplates();
  return NextResponse.json(templates.map(toSummary));
}

export async function POST(request: NextRequest) {
  const auth = await ensureSuperadmin();
  if (!auth.ok) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const nameInput = formData.get("name");
  const templateTypeInput = formData.get("templateType");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File wajib diunggah." }, { status: 400 });
  }

  const originalFilename = file.name || "template.docx";
  const loweredName = originalFilename.toLowerCase();
  if (!loweredName.endsWith(".docx")) {
    return NextResponse.json({ error: "Format file harus .docx" }, { status: 400 });
  }

  const nameFromUser = typeof nameInput === "string" ? nameInput.trim() : "";
  const defaultName = originalFilename.replace(/\.docx$/i, "").trim() || "Template Surat";
  const name = nameFromUser || defaultName;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const resolvedTemplateType = (
    typeof templateTypeInput === "string" ? templateTypeInput.trim() : ""
  ) as DecisionLetterTemplateType;

  const templateType: DecisionLetterTemplateType =
    resolvedTemplateType === "LAB_SKRIPSI" || resolvedTemplateType === "LAB_LAINNYA" || resolvedTemplateType === "GENERAL"
      ? resolvedTemplateType
      : "GENERAL";

  try {
    const created = await createTemplateFromDocx({
      templateType,
      name,
      originalFilename,
      mimeType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileBuffer: buffer,
    });

    return NextResponse.json(toSummary(created), { status: 201 });
  } catch (error) {
    console.error("[api/admin/templates] Failed to upload template DOCX", {
      name,
      originalFilename,
      mimeType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: buffer.byteLength,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal mengunggah template. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
