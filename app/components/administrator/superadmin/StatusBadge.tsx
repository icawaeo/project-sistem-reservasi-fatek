type StatusBadgeProps = {
  status: string;
};

const styleByGroup = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

const labelMap: Record<string, string> = {
  PENDING_DEKAN: "Menunggu Persetujuan Dekan",
  PENDING_WD2: "Menunggu TTD Wakil Dekan 2",
  PENDING_WAKIL_DEKAN_2: "Menunggu TTD Wakil Dekan 2",
  PENDING_KABAG: "Menunggu Konfirmasi Kabag",

  // Fallback pending (jika belum ada granular step)
  PENDING: "Menunggu Persetujuan Dekan",

  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
  CANCELED: "Dibatalkan",

  // Jika status sudah berupa label
  "MENUNGGU PERSETUJUAN DEKAN": "Menunggu Persetujuan Dekan",
  "MENUNGGU TTD WAKIL DEKAN 2": "Menunggu TTD Wakil Dekan 2",
  "MENUNGGU KONFIRMASI KABAG": "Menunggu Konfirmasi Kabag",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  DIBATALKAN: "Dibatalkan",
};

function resolveStatusLabelAndClass(status: string) {
  const normalized = status.toUpperCase();

  if (labelMap[normalized]) {
    const label = labelMap[normalized];
    if (normalized.startsWith("PENDING")) {
      return { label, className: styleByGroup.pending };
    }
    if (normalized === "APPROVED" || normalized === "DISETUJUI") {
      return { label, className: styleByGroup.approved };
    }
    if (normalized === "REJECTED" || normalized === "DITOLAK") {
      return { label, className: styleByGroup.rejected };
    }
    if (normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "DIBATALKAN") {
      return { label, className: styleByGroup.cancelled };
    }
    return { label, className: styleByGroup.cancelled };
  }

  if (normalized.startsWith("PENDING")) {
    if (normalized.includes("DEKAN")) {
      return { label: "Menunggu Persetujuan Dekan", className: styleByGroup.pending };
    }
    if (normalized.includes("WD2") || normalized.includes("WAKIL")) {
      return { label: "Menunggu TTD Wakil Dekan 2", className: styleByGroup.pending };
    }
    if (normalized.includes("KABAG")) {
      return { label: "Menunggu Konfirmasi Kabag", className: styleByGroup.pending };
    }
    return { label: "Menunggu Persetujuan Dekan", className: styleByGroup.pending };
  }

  if (normalized.includes("APPROV")) {
    return { label: "Disetujui", className: styleByGroup.approved };
  }
  if (normalized.includes("REJECT")) {
    return { label: "Ditolak", className: styleByGroup.rejected };
  }
  if (normalized.includes("CANCEL")) {
    return { label: "Dibatalkan", className: styleByGroup.cancelled };
  }

  return { label: status, className: styleByGroup.cancelled };
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const resolved = resolveStatusLabelAndClass(status);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${resolved.className}`}
    >
      {resolved.label}
    </span>
  );
}