import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mammoth from "mammoth";

export type PlaceholderMappingValue = string | null;

export type DecisionLetterTemplateType = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

export type LetterTemplateMeta = {
  id: string;
  templateType: DecisionLetterTemplateType;
  name: string;
  originalFilename: string;
  storedFilename: string;
  storedPath: string; // relative to project root
  pdfOriginalFilename?: string;
  pdfStoredFilename?: string;
  pdfStoredPath?: string; // relative to project root
  fileSize: number;
  mimeType: string;
  pdfMimeType?: string;
  placeholders: string[];
  extractedText: string;
  mapping: Record<string, PlaceholderMappingValue>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const TEMPLATE_DIR = path.join(process.cwd(), "uploads", "templates");
const META_PATH = path.join(TEMPLATE_DIR, "templates.json");

const ensureStoreReady = async () => {
  await fs.mkdir(TEMPLATE_DIR, { recursive: true });

  try {
    await fs.access(META_PATH);
  } catch {
    await fs.writeFile(META_PATH, JSON.stringify([]), "utf8");
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readAll = async (): Promise<LetterTemplateMeta[]> => {
  await ensureStoreReady();
  const raw = await fs.readFile(META_PATH, "utf8");

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const coerceType = (value: unknown): DecisionLetterTemplateType => {
      if (value === "GENERAL" || value === "LAB_SKRIPSI" || value === "LAB_LAINNYA") {
        return value;
      }
      return "GENERAL";
    };

    const normalized = parsed
      .filter(isRecord)
      .map((item) => {
        const templateType = coerceType(item.templateType);
        const base = item as unknown as LetterTemplateMeta;
        return {
          ...base,
          templateType,
          isActive: Boolean(item.isActive),
        } satisfies LetterTemplateMeta;
      });

    // Ensure max 1 active per templateType (keep the most recently updated).
    const latestActiveByType = new Map<DecisionLetterTemplateType, LetterTemplateMeta>();
    for (const item of normalized) {
      if (!item.isActive) continue;
      const existing = latestActiveByType.get(item.templateType);
      if (!existing) {
        latestActiveByType.set(item.templateType, item);
        continue;
      }
      const existingUpdated = new Date(existing.updatedAt).getTime();
      const itemUpdated = new Date(item.updatedAt).getTime();
      if (itemUpdated >= existingUpdated) {
        latestActiveByType.set(item.templateType, item);
      }
    }

    const cleaned = normalized.map((item) => {
      const chosen = latestActiveByType.get(item.templateType);
      if (!chosen) {
        return item;
      }
      return {
        ...item,
        isActive: item.id === chosen.id,
      };
    });

    return cleaned as LetterTemplateMeta[];
  } catch {
    return [];
  }
};

const writeAll = async (templates: LetterTemplateMeta[]) => {
  await ensureStoreReady();
  await fs.writeFile(META_PATH, JSON.stringify(templates, null, 2), "utf8");
};

const execFileAsync = promisify(execFile);

const logLibreOfficeError = (payload: {
  stage: "convert" | "ensurePdfPreview" | "createTemplateFromDocx";
  soffice: string;
  inputAbsolutePath: string;
  outputDirAbsolutePath: string;
  expectedPdfAbsolutePath: string;
  error: unknown;
}) => {
  const error = payload.error;
  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; signal?: unknown; stdout?: unknown; stderr?: unknown })
      : null;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const code =
    typeof details?.code === "string" || typeof details?.code === "number" ? details.code : undefined;
  const signal = typeof details?.signal === "string" ? details.signal : undefined;
  const stdout = typeof details?.stdout === "string" ? details.stdout : undefined;
  const stderr = typeof details?.stderr === "string" ? details.stderr : undefined;

  console.error("[template-store] LibreOffice conversion error", {
    stage: payload.stage,
    soffice: payload.soffice,
    inputAbsolutePath: payload.inputAbsolutePath,
    outputDirAbsolutePath: payload.outputDirAbsolutePath,
    expectedPdfAbsolutePath: payload.expectedPdfAbsolutePath,
    message,
    stack,
    code,
    signal,
    stdout,
    stderr,
  });
};

const resolveLibreOfficeExecutable = async () => {
  const configured = (process.env.LIBREOFFICE_PATH ?? process.env.SOFFICE_PATH ?? "").trim();
  if (configured) {
    return configured;
  }

  const absoluteCandidates = [
    path.join("C:", "Program Files", "LibreOffice", "program", "soffice.exe"),
    path.join("C:", "Program Files", "LibreOffice", "program", "soffice.com"),
    path.join("C:", "Program Files (x86)", "LibreOffice", "program", "soffice.exe"),
    path.join("C:", "Program Files (x86)", "LibreOffice", "program", "soffice.com"),
  ];

  for (const candidate of absoluteCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  // Fallback to PATH resolution.
  return process.platform === "win32" ? "soffice.exe" : "soffice";
};

const convertDocxToPdf = async (params: {
  inputAbsolutePath: string;
  outputDirAbsolutePath: string;
  expectedPdfAbsolutePath: string;
}) => {
  const soffice = await resolveLibreOfficeExecutable();

  try {
    await execFileAsync(
      soffice,
      [
        "--headless",
        "--nologo",
        "--nolockcheck",
        "--nodefault",
        "--nofirststartwizard",
        "--convert-to",
        "pdf",
        "--outdir",
        params.outputDirAbsolutePath,
        params.inputAbsolutePath,
      ],
      {
        windowsHide: true,
        timeout: 60_000,
      }
    );
  } catch (error) {
    // Capture useful diagnostics from execFile error when available.
    logLibreOfficeError({
      stage: "convert",
      soffice,
      inputAbsolutePath: params.inputAbsolutePath,
      outputDirAbsolutePath: params.outputDirAbsolutePath,
      expectedPdfAbsolutePath: params.expectedPdfAbsolutePath,
      error,
    });

    const details =
      typeof error === "object" && error !== null ? (error as { code?: unknown }) : null;
    if (details?.code === "ENOENT") {
      throw new Error(
        "LibreOffice tidak ditemukan (soffice ENOENT). Install LibreOffice atau set LIBREOFFICE_PATH ke lokasi soffice (contoh: C:\\Program Files\\LibreOffice\\program\\soffice.exe)."
      );
    }
    throw new Error(
      "Gagal menjalankan LibreOffice untuk membuat preview PDF. Pastikan LibreOffice terpasang dan dapat diakses (set LIBREOFFICE_PATH bila perlu)."
    );
  }

  try {
    await fs.access(params.expectedPdfAbsolutePath);
  } catch {
    console.error("[template-store] LibreOffice output PDF not found", {
      soffice,
      expectedPdfAbsolutePath: params.expectedPdfAbsolutePath,
      inputAbsolutePath: params.inputAbsolutePath,
    });
    throw new Error(
      "Gagal membuat preview PDF. Pastikan LibreOffice terpasang dan dapat diakses (set LIBREOFFICE_PATH bila perlu)."
    );
  }
};

const extractPlaceholders = (text: string) => {
  const matches = text.match(/{{\s*[a-zA-Z0-9_\.]+\s*}}/g) ?? [];
  const normalized = matches
    .map((value) => value.replace(/[{}]/g, "").trim())
    .filter(Boolean);

  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
};

export const listTemplates = async () => {
  const templates = await readAll();
  return templates.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const getTemplate = async (id: string) => {
  const templates = await readAll();
  return templates.find((item) => item.id === id) ?? null;
};

export const getActiveTemplateByType = async (templateType: DecisionLetterTemplateType) => {
  const templates = await readAll();
  const ofType = templates.filter((item) => item.templateType === templateType);
  const active = ofType.find((item) => item.isActive) ?? null;
  if (active) {
    return active;
  }

  // Fallback to latest updated template of that type.
  const sorted = [...ofType].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return sorted[0] ?? null;
};

export const createTemplateFromDocx = async (params: {
  templateType: DecisionLetterTemplateType;
  name: string;
  originalFilename: string;
  mimeType: string;
  fileBuffer: Buffer;
}) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const storedFilename = `${id}.docx`;
  const storedPath = path.join("uploads", "templates", storedFilename);
  const absolutePath = path.join(process.cwd(), storedPath);

  const pdfStoredFilename = `${id}.pdf`;
  const pdfStoredPath = path.join("uploads", "templates", pdfStoredFilename);
  const pdfAbsolutePath = path.join(process.cwd(), pdfStoredPath);

  await ensureStoreReady();
  await fs.writeFile(absolutePath, params.fileBuffer);

  try {
    await convertDocxToPdf({
      inputAbsolutePath: absolutePath,
      outputDirAbsolutePath: TEMPLATE_DIR,
      expectedPdfAbsolutePath: pdfAbsolutePath,
    });
  } catch (error) {
    console.error("[template-store] Failed to create PDF preview after DOCX upload", {
      templateId: id,
      name: params.name,
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
      fileSize: params.fileBuffer.byteLength,
      storedPath: storedPath.replace(/\\/g, "/"),
      pdfStoredPath: pdfStoredPath.replace(/\\/g, "/"),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await fs.unlink(absolutePath);
    } catch {
      // ignore
    }
    throw error;
  }

  const extracted = await mammoth.extractRawText({ buffer: params.fileBuffer });
  const extractedText = (extracted.value ?? "").trim();
  const placeholders = extractPlaceholders(extractedText);
  const mapping: Record<string, PlaceholderMappingValue> = Object.fromEntries(
    placeholders.map((placeholder) => [placeholder, null])
  );

  const meta: LetterTemplateMeta = {
    id,
    templateType: params.templateType,
    name: params.name,
    originalFilename: params.originalFilename,
    storedFilename,
    storedPath: storedPath.replace(/\\/g, "/"),
    pdfOriginalFilename: params.originalFilename.replace(/\.docx$/i, ".pdf"),
    pdfStoredFilename,
    pdfStoredPath: pdfStoredPath.replace(/\\/g, "/"),
    fileSize: params.fileBuffer.byteLength,
    mimeType: params.mimeType,
    pdfMimeType: "application/pdf",
    placeholders,
    extractedText,
    mapping,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const existing = await readAll();

  const replaced = existing.filter((item) => item.templateType === params.templateType);
  const remaining = existing.filter((item) => item.templateType !== params.templateType);

  // Replace: keep exactly 1 template per flow/type.
  await writeAll([meta, ...remaining]);

  // Best-effort cleanup of previous template files for this type.
  for (const old of replaced) {
    try {
      await fs.unlink(path.join(process.cwd(), old.storedPath));
    } catch {
      // ignore missing files
    }

    if (old.pdfStoredPath) {
      try {
        await fs.unlink(path.join(process.cwd(), old.pdfStoredPath));
      } catch {
        // ignore missing files
      }
    }
  }

  return meta;
};

export const ensurePdfPreview = async (id: string) => {
  const templates = await readAll();
  const index = templates.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const template = templates[index];
  const docxAbsolutePath = path.join(process.cwd(), template.storedPath);
  const pdfStoredFilename = template.pdfStoredFilename ?? `${template.id}.pdf`;
  const pdfStoredPath = template.pdfStoredPath ?? path.join("uploads", "templates", pdfStoredFilename);
  const pdfAbsolutePath = path.join(process.cwd(), pdfStoredPath);

  try {
    await fs.access(pdfAbsolutePath);
  } catch {
    try {
      await convertDocxToPdf({
        inputAbsolutePath: docxAbsolutePath,
        outputDirAbsolutePath: TEMPLATE_DIR,
        expectedPdfAbsolutePath: pdfAbsolutePath,
      });
    } catch (error) {
      console.error("[template-store] Failed to ensure PDF preview", {
        templateId: id,
        storedPath: template.storedPath,
        pdfStoredPath,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  const now = new Date().toISOString();
  const updated: LetterTemplateMeta = {
    ...template,
    pdfStoredFilename,
    pdfStoredPath: pdfStoredPath.replace(/\\/g, "/"),
    pdfMimeType: template.pdfMimeType ?? "application/pdf",
    updatedAt: now,
  };

  templates[index] = updated;
  await writeAll(templates);

  return updated;
};

export const updateTemplate = async (
  id: string,
  patch: Partial<Pick<LetterTemplateMeta, "name" | "mapping" | "placeholders" | "extractedText">>
) => {
  const templates = await readAll();
  const index = templates.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const current = templates[index];
  const updated: LetterTemplateMeta = {
    ...current,
    ...patch,
    updatedAt: now,
  };

  templates[index] = updated;
  await writeAll(templates);
  return updated;
};

export const setActiveTemplate = async (id: string) => {
  const templates = await readAll();
  const resolved = templates.find((item) => item.id === id);
  if (!resolved) {
    return null;
  }

  const templateType = resolved.templateType;

  const now = new Date().toISOString();
  const updated = templates.map((item) => {
    if (item.templateType !== templateType) {
      return item;
    }
    const isActive = item.id === id;
    return {
      ...item,
      isActive,
      updatedAt: isActive ? now : item.updatedAt,
    };
  });

  await writeAll(updated);
  return updated.find((item) => item.id === id) ?? null;
};

export const deleteTemplate = async (id: string) => {
  const templates = await readAll();
  const template = templates.find((item) => item.id === id);
  if (!template) {
    return false;
  }

  const absolutePath = path.join(process.cwd(), template.storedPath);
  const pdfAbsolutePath = template.pdfStoredPath ? path.join(process.cwd(), template.pdfStoredPath) : null;

  const remainingRaw = templates.filter((item) => item.id !== id);

  let remaining = remainingRaw;
  if (template.isActive) {
    const sameType = remainingRaw.filter((item) => item.templateType === template.templateType);
    const nextActive = [...sameType].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0] ?? null;
    if (nextActive) {
      remaining = remainingRaw.map((item) => {
        if (item.templateType !== template.templateType) {
          return item;
        }
        return { ...item, isActive: item.id === nextActive.id };
      });
    }
  }

  await writeAll(remaining);

  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore missing files
  }

  if (pdfAbsolutePath) {
    try {
      await fs.unlink(pdfAbsolutePath);
    } catch {
      // ignore missing files
    }
  }

  return true;
};
