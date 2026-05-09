"use client";

import { useToast } from "@/app/components/ui/toast";
import { AlertTriangle, Loader2, X } from "lucide-react";

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function DeleteConfirmationModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const { pushToast } = useToast();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      pushToast({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">
            Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
