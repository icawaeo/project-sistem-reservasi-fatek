"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, Plus, Trash2, X } from "lucide-react";

export type TemplateSummary = {
  id: string;
  name: string;
  originalFilename: string;
  pdfOriginalFilename?: string | null;
  hasPdfPreview?: boolean;
  fileSize: number;
  placeholders: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Feedback = { type: "success" | "error"; message: string };

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(date);
};

const buildErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
};

export default function TemplateSuratManagementContent({
  initialTemplates,
}: {
  initialTemplates: TemplateSummary[];
}) {
  const [templates, setTemplates] = useState<TemplateSummary[]>(initialTemplates);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => {
    const active = initialTemplates.find((item) => item.isActive);
    return active?.id ?? initialTemplates[0]?.id ?? null;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDocx, setUploadDocx] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);

  const refreshList = async () => {
    const response = await fetch("/api/admin/templates");

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal memuat daftar template."));
    }

    const items: TemplateSummary[] = await response.json();
    setTemplates(items);
  };

  const handleDocxChange = (file: File | null) => {
    setUploadError(null);
    setUploadDocx(null);

    if (!file) {
      return;
    }

    const lowered = (file.name || "").toLowerCase();
    if (!lowered.endsWith(".docx")) {
      setUploadError("Format file template harus .docx");
      return;
    }

    setUploadDocx(file);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadName("");
    setUploadDocx(null);
    setUploadError(null);
    setUploadInputKey((value) => value + 1);
  };

  const handleUpload = async () => {
    setFeedback(null);
    setUploadError(null);

    if (!uploadDocx) {
      setUploadError("Silakan pilih file template .docx terlebih dahulu.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadDocx);
      formData.append("name", uploadName.trim());

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal mengunggah template."));
      }

      await response.json();

      setFeedback({ type: "success", message: "Template berhasil ditambahkan." });
      closeUploadModal();

      await refreshList();
      // template baru otomatis menjadi template aktif
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah template.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteActive = async () => {
    if (!activeTemplate) {
      return;
    }

    setFeedback(null);

    const confirmed = window.confirm("Hapus template aktif? File DOCX dan PDF preview juga akan terhapus.");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/templates/${activeTemplate.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus template."));
      }

      setFeedback({ type: "success", message: "Template berhasil dihapus." });
      await refreshList();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus template.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeTemplate = useMemo(() => {
    return templates.find((item) => item.isActive) ?? templates[0] ?? null;
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    if (!templates.length) {
      return null;
    }

    const resolved = templates.find((item) => item.id === selectedTemplateId);
    return resolved ?? activeTemplate;
  }, [activeTemplate, selectedTemplateId, templates]);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [templates]);

  return (
    <main className="flex min-h-screen flex-col gap-5 p-4 lg:p-7">
      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm lg:px-5 lg:py-4 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="flex flex-1 min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kelola Template Surat</h3>
            <p className="text-sm text-slate-500">Sistem hanya menggunakan 1 template aktif.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={16} /> Template Baru
            </button>

            <button
              type="button"
              onClick={() => refreshList().catch(() => null)}
              className="w-fit rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={handleDeleteActive}
              disabled={!activeTemplate || isDeleting}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Hapus Template
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-1 min-h-0 flex-col gap-6 lg:flex-row">
          <section className="flex min-h-0 flex-col gap-4 lg:w-1/3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Daftar Template</h4>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
              {sortedTemplates.length ? (
                sortedTemplates.map((item) => {
                  const isSelected = item.id === (selectedTemplate?.id ?? null);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-slate-900 bg-white"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </span>

                        {isSelected ? (
                          <span className="text-xs font-semibold text-slate-900">Sedang dilihat</span>
                        ) : null}
                      </div>

                      <p className="mt-3 wrap-break-word font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Terakhir diperbarui: {formatDateTime(item.updatedAt)}</p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <FileText size={14} className="text-slate-400" />
                        <span className="truncate">{item.originalFilename}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Belum ada template. Klik “Template Baru” untuk mengunggah.
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col lg:w-2/3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Preview Dokumen</h4>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {!selectedTemplate ? (
                <div className="px-4 py-4 text-sm text-slate-500">Pilih template untuk melihat preview.</div>
              ) : selectedTemplate.hasPdfPreview ? (
                <iframe
                  title="Preview template surat"
                  src={`/api/admin/templates/${selectedTemplate.id}/pdf`}
                  className="h-full w-full flex-1"
                />
              ) : (
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">Preview belum tersedia</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sistem akan mengonversi DOCX ke PDF via LibreOffice secara otomatis. Jika preview belum muncul, coba klik
                    Refresh.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {isUploadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Tutup"
            onClick={closeUploadModal}
            className="absolute inset-0 bg-slate-900/40"
          />

          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">Upload Template Surat</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Unggah file .docx. Sistem akan otomatis mengonversi ke PDF untuk preview.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Nama Template</label>
                <input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Contoh: Surat Persetujuan Peminjaman"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">File Template (.docx)</label>
                <input
                  key={uploadInputKey}
                  type="file"
                  accept=".docx"
                  onChange={(e) => handleDocxChange(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-2 text-xs text-slate-500">Pastikan server memiliki LibreOffice untuk membuat preview PDF.</p>
                {uploadError ? <p className="mt-2 text-sm text-rose-600">{uploadError}</p> : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeUploadModal}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !uploadDocx}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {isUploading ? "Mengunggah..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
