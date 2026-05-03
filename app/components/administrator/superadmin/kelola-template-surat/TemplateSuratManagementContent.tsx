"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import { buildErrorMessage } from "@/app/components/administrator/common/http";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";

type TemplateType = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

export type TemplateSummary = {
  id: string;
  templateType: TemplateType;
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

const resolveTemplateTypeLabel = (value: TemplateType) => {
  if (value === "LAB_SKRIPSI") return "Lab - Skripsi";
  if (value === "LAB_LAINNYA") return "Lab - Lainnya";
  return "Umum";
};

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

export default function TemplateSuratManagementContent({
  initialTemplates,
}: {
  initialTemplates: TemplateSummary[];
}) {
  const { pushToast } = useToast();
  const [templates, setTemplates] = useState<TemplateSummary[]>(initialTemplates);

  const [selectedType, setSelectedType] = useState<TemplateType>("GENERAL");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [uploadTemplateType, setUploadTemplateType] = useState<TemplateType>("GENERAL");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDocx, setUploadDocx] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const refreshList = async () => {
    const response = await fetch("/api/admin/templates");

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal memuat daftar template."));
    }

    const items: TemplateSummary[] = await response.json();
    setTemplates(items);
  };

  const activeTemplateByType = useMemo(() => {
    const types: TemplateType[] = ["GENERAL", "LAB_SKRIPSI", "LAB_LAINNYA"];

    return Object.fromEntries(
      types.map((type) => {
        const ofType = templates.filter((item) => item.templateType === type);
        const active = ofType.find((item) => item.isActive) ?? null;
        const latest =
          [...ofType].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
        return [type, active ?? latest] as const;
      })
    ) as Record<TemplateType, TemplateSummary | null>;
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    return activeTemplateByType[selectedType] ?? null;
  }, [activeTemplateByType, selectedType]);

  useEffect(() => {
    if (selectedTemplate) {
      return;
    }

    const fallbackType = (["GENERAL", "LAB_SKRIPSI", "LAB_LAINNYA"] as TemplateType[]).find(
      (type) => Boolean(activeTemplateByType[type])
    );

    if (fallbackType && fallbackType !== selectedType) {
      setSelectedType(fallbackType);
    }
  }, [activeTemplateByType, selectedTemplate, selectedType]);

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
      formData.append("templateType", uploadTemplateType);

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal mengunggah template."));
      }

      await response.json();

      pushToast({ type: "success", message: "Template berhasil ditambahkan." });

      // Switch preview to the uploaded template type.
      setSelectedType(uploadTemplateType);
      closeUploadModal();

      try {
        await refreshList();
      } catch (error) {
        pushToast({
          type: "error",
          message: error instanceof Error ? error.message : "Gagal memuat daftar template.",
        });
      }
      // template baru otomatis menjadi template aktif untuk kategori yang dipilih
    } catch (error) {
      pushToast({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah template.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedTemplate) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSelected = async () => {
    if (!selectedTemplate) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus template."));
      }

      pushToast({ type: "success", message: "Template berhasil dihapus." });
      setIsDeleteModalOpen(false);

      try {
        await refreshList();
      } catch (error) {
        pushToast({
          type: "error",
          message: error instanceof Error ? error.message : "Gagal memuat daftar template.",
        });
      }
    } catch (error) {
      pushToast({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus template.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const templateCards = useMemo(() => {
    return [
      {
        type: "GENERAL" as const,
        label: "Alur Peminjaman Umum",
        template: activeTemplateByType.GENERAL,
      },
      {
        type: "LAB_SKRIPSI" as const,
        label: "Alur Lab - Kebutuhan Skripsi",
        template: activeTemplateByType.LAB_SKRIPSI,
      },
      {
        type: "LAB_LAINNYA" as const,
        label: "Alur Lab - Kategori Lainnya",
        template: activeTemplateByType.LAB_LAINNYA,
      },
    ];
  }, [activeTemplateByType]);

  return (
    <main className="flex min-h-screen flex-col gap-5 p-4 lg:p-7">
      <section className="flex flex-1 min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kelola Template Surat</h3>
            {/* <p className="text-sm text-slate-500">Klik salah satu daftar template untuk melihat preview.</p> */}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadTemplateType(selectedType);
                setIsUploadModalOpen(true);
              }}
              className="hidden items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 lg:inline-flex"
            >
              <Plus size={16} /> Upload Template
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={!selectedTemplate || isDeleting}
              className="hidden items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Hapus Template
            </button>
          </div>

          {/* Mobile / tablet full-width actions */}
          <div className="mt-3 w-full lg:hidden">
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  setUploadTemplateType(selectedType);
                  setIsUploadModalOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={16} /> Upload Template
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={!selectedTemplate || isDeleting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Hapus Template
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-1 min-h-0 flex-col gap-6 lg:flex-row">
          <section className="flex min-h-0 flex-col gap-4 lg:w-1/3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Daftar Template</h4>
            </div>

            <p className="text-sm text-slate-500">
              Pilih salah satu kategori di bawah. Kategori yang dipilih akan tampil di preview.
            </p>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
              {templateCards.map((card) => {
                const item = card.template;
                const isSelected = card.type === selectedType;

                return (
                  <div
                    key={card.type}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedType(card.type)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedType(card.type);
                    }}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      isSelected ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
                      <span
                        className={`inline-flex items-center text-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isSelected ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isSelected ? "Dipilih" : "Klik untuk pilih"}
                      </span>
                    </div>

                    {item ? (
                      <>
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Aktif
                          </span>
                        </div>

                        <p className="mt-3 wrap-break-word font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Terakhir diperbarui: {formatDateTime(item.updatedAt)}</p>

                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <FileText size={14} className="text-slate-400" />
                          <span className="truncate">{item.originalFilename}</span>
                        </div>

                        {/* Mobile-only preview button inside each card */}
                        <div className="mt-3 lg:hidden">
                          <a
                            href={`/api/admin/templates/${item.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              // allow the link to open; prevent parent click from re-selecting if necessary
                              e.stopPropagation();
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                          >
                            <FileText size={14} /> Preview Surat
                          </a>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Belum ada template. Klik “Upload Template” untuk menambahkan.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="hidden min-h-0 flex-1 flex-col lg:flex lg:w-2/3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Preview Dokumen</h4>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Kategori: {resolveTemplateTypeLabel(selectedType)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {!selectedTemplate ? (
                <div className="px-4 py-4 text-sm text-slate-500">
                  Belum ada template untuk kategori “{resolveTemplateTypeLabel(selectedType)}”. Upload template untuk melihat
                  preview.
                </div>
              ) : selectedTemplate.hasPdfPreview ? (
                <object
                  key={selectedTemplate.id}
                  data={`/api/admin/templates/${selectedTemplate.id}/pdf`}
                  type="application/pdf"
                  className="h-full w-full flex-1"
                  title="Preview template surat"
                >
                  <div className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-700">PDF tidak ditemukan</p>
                    <p className="mt-1 text-sm text-slate-500">
                      File preview PDF tidak tersedia atau gagal dimuat. Coba unggah ulang template.
                    </p>
                  </div>
                </object>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">Preview belum tersedia</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sistem akan mengonversi DOCX ke PDF via LibreOffice secara otomatis. Jika preview belum muncul, coba unggah ulang
                    template.
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
                <label className="text-sm font-semibold text-slate-700">Jenis Template</label>
                <select
                  value={uploadTemplateType}
                  onChange={(e) => setUploadTemplateType(e.target.value as TemplateType)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="GENERAL">Alur Peminjaman Umum</option>
                  <option value="LAB_SKRIPSI">Alur Lab - Kebutuhan Skripsi</option>
                  <option value="LAB_LAINNYA">Alur Lab - Kategori Lainnya</option>
                </select>
              </div>

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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Hapus Template"
        description={
          selectedTemplate
            ? `Hapus template “${selectedTemplate.name}” untuk kategori ${resolveTemplateTypeLabel(
                selectedType
              )}? File DOCX dan PDF preview juga akan terhapus.`
            : "Hapus template terpilih?"
        }
        onConfirm={confirmDeleteSelected}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </main>
  );
}
