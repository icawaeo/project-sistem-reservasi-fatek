"use client";

import { useMemo, useState } from "react";
import { Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/monitoring-pengajuan/reservation-types";
import { computeReservationStatus, resolveReservationStatusGroup } from "@/app/components/administrator/ui/reservationStatus";
import UniversalReservationTable from "@/app/components/administrator/ui/UniversalReservationTable";

type AdminDashboardContentProps = {
  adminData: AdminReservationRecord[];
  adminRole: AdminRole;
  lastSync: string;
};

type StatCardConfig = {
  icon: React.ElementType;
  label: string;
  value: number;
  sublabel: string;
  accentClass: string;
  iconBgClass: string;
  iconTextClass: string;
  borderClass: string;
};

function AdminStatCard({ icon: Icon, label, value, sublabel, accentClass, iconBgClass, iconTextClass, borderClass }: StatCardConfig) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md md:p-5 ${borderClass}`}
    >
      {/* Subtle accent bar at the top */}
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />

      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500 md:text-xs md:tracking-[0.12em]">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-bold leading-none tracking-tight text-slate-900 md:mt-2 md:text-3xl">
            {value}
          </p>
          <p className="mt-1.5 text-[10px] font-medium text-slate-500 md:mt-2 md:text-xs">{sublabel}</p>
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 md:h-10 md:w-10 md:rounded-xl ${iconBgClass} ${iconTextClass}`}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardContent({
  adminData,
  adminRole,
  lastSync,
}: AdminDashboardContentProps) {
  const [tableData, setTableData] = useState<AdminReservationRecord[]>(adminData);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const item of tableData) {
      const computed = computeReservationStatus(item.status, item.endTime);
      const group = resolveReservationStatusGroup(computed);

      if (group === "PENDING") pending += 1;
      else if (group === "APPROVED" || group === "COMPLETED") approved += 1;
      else if (group === "REJECTED") rejected += 1;
    }

    return { pending, approved, rejected, total: tableData.length };
  }, [tableData]);

  const handleAdminStatusUpdated = (id: string, updates: Partial<AdminReservationRecord>) => {
    setTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const statCards: StatCardConfig[] = [
    {
      icon: Clock,
      label: "Pengajuan Tertunda",
      value: stats.pending,
      sublabel: "Menunggu persetujuan",
      accentClass: "bg-amber-400",
      iconBgClass: "bg-amber-50",
      iconTextClass: "text-amber-600",
      borderClass: "border-slate-200",
    },
    {
      icon: CheckCircle2,
      label: "Pengajuan Diterima",
      value: stats.approved,
      sublabel: "Disetujui & selesai",
      accentClass: "bg-emerald-400",
      iconBgClass: "bg-emerald-50",
      iconTextClass: "text-emerald-600",
      borderClass: "border-slate-200",
    },
    {
      icon: XCircle,
      label: "Pengajuan Ditolak",
      value: stats.rejected,
      sublabel: "Tidak disetujui",
      accentClass: "bg-rose-400",
      iconBgClass: "bg-rose-50",
      iconTextClass: "text-rose-600",
      borderClass: "border-slate-200",
    },
    {
      icon: FileText,
      label: "Total Pengajuan",
      value: stats.total,
      sublabel: "Seluruh pengajuan masuk",
      accentClass: "bg-blue-400",
      iconBgClass: "bg-blue-50",
      iconTextClass: "text-blue-600",
      borderClass: "border-slate-200",
    },
  ];

  return (
    <main className="space-y-6 p-4 lg:p-7">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statCards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Reservation table section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Daftar Pengajuan Masuk</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola dan proses seluruh pengajuan peminjaman ruangan
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Terakhir diperbarui: {lastSync} WITA</p>
        </div>

        <UniversalReservationTable
          data={tableData}
          mode="admin"
          adminRole={adminRole}
          onStatusUpdated={handleAdminStatusUpdated}
        />
      </section>
    </main>
  );
}
