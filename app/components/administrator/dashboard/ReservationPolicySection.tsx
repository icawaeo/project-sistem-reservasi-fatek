"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";

import SectionCard from "@/app/components/administrator/ui/SectionCard";
import { useToast } from "@/app/components/ui/toast";

type ReservationPolicySectionProps = {
  initialMinDaysAheadExclusive: number;
};

export default function ReservationPolicySection({
  initialMinDaysAheadExclusive,
}: ReservationPolicySectionProps) {
  const { pushToast } = useToast();
  const [value, setValue] = useState(String(initialMinDaysAheadExclusive));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
      pushToast({ type: "error", message: "Masukkan angka H-n antara 0 sampai 30." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/reservation-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minDaysAheadExclusive: parsed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menyimpan aturan reservasi.");
      }

      setValue(String(payload.minDaysAheadExclusive));
      pushToast({ type: "success", message: "Aturan batas pengajuan reservasi berhasil diperbarui." });
    } catch (error) {
      pushToast({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan aturan reservasi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Batas Waktu Pengajuan Reservasi</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tentukan batas hari minimal untuk pengajuan reservasi sebelum tanggal peminjaman.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nilai H-n</span>
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              <span className="border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">H-</span>
              <input
                type="number"
                min={0}
                max={30}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="w-24 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
