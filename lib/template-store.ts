import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mammoth from "mammoth";

export type PlaceholderMappingValue = string | null;

export type LetterTemplateMeta = {
  id: string;
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

const readAll = async (): Promise<LetterTemplateMeta[]> => {
  await ensureStoreReady();
  const raw = await fs.readFile(META_PATH, "utf8");

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as LetterTemplateMeta[];
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
  const asAny = error as any;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const code = typeof asAny?.code === "string" || typeof asAny?.code === "number" ? asAny.code : undefined;
  const signal = typeof asAny?.signal === "string" ? asAny.signal : undefined;
  const stdout = typeof asAny?.stdout === "string" ? asAny.stdout : undefined;
  const stderr = typeof asAny?.stderr === "string" ? asAny.stderr : undefined;

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

    const asAny = error as any;
    if (asAny?.code === "ENOENT") {
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

export const createTemplateFromDocx = async (params: {
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
  for (const item of existing) {
    const docxPath = path.join(process.cwd(), item.storedPath);
    const pdfPath = item.pdfStoredPath ? path.join(process.cwd(), item.pdfStoredPath) : null;

    try {
      await fs.unlink(docxPath);
    } catch {
      // ignore
    }

    if (pdfPath) {
      try {
        await fs.unlink(pdfPath);
      } catch {
        // ignore
      }
    }
  }

  await writeAll([meta]);

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
  const exists = templates.some((item) => item.id === id);
  if (!exists) {
    return null;
  }

  const now = new Date().toISOString();
  const updated = templates.map((item) => ({
    ...item,
    isActive: item.id === id,
    updatedAt: item.id === id ? now : item.updatedAt,
  }));

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

  const remaining = templates.filter((item) => item.id !== id);
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
