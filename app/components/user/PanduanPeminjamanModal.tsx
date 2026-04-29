"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import PanduanPeminjamanContent from "@/app/components/user/PanduanPeminjamanContent";

type PanduanPeminjamanModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function PanduanPeminjamanModal({ open, onClose }: PanduanPeminjamanModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    queueMicrotask(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="panduan-peminjaman-title"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25"
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
          <div>
            <h3
              id="panduan-peminjaman-title"
              className="text-lg font-black tracking-tight text-slate-900 md:text-xl"
            >
              Panduan Peminjaman Ruangan
            </h3>
            <p className="mt-1 text-xs text-slate-600 md:text-sm">
              Langkah peminjaman dan aturan yang harus dipatuhi.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Tutup panduan"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <PanduanPeminjamanContent />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
