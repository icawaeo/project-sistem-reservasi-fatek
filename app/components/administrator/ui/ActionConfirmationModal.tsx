"use client";

import { useToast } from "@/app/components/ui/toast";
import { AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";

type ActionConfirmationModalProps = {
  isOpen: boolean;
  action: "APPROVE" | "REJECT" | null;
  title: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function ActionConfirmationModal({
  isOpen,
  action,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: ActionConfirmationModalProps) {
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

  const isApprove = action === "APPROVE";
  const iconBg = isApprove ? "bg-emerald-100" : "bg-rose-100";
  const iconColor = isApprove ? "text-emerald-600" : "text-rose-600";
  const Icon = isApprove ? CheckCircle : AlertTriangle;

  const btnBg = isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${iconBg} ${iconColor}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
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
        <div className="px-5 py-6">
          <p className="text-sm text-slate-600">
            {description}
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
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${btnBg}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Memproses..." : "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  );
}
