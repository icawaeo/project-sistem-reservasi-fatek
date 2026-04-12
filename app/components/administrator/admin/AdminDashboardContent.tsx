"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";

import StatCard from "@/app/components/administrator/StatCard";
import {
  computeReservationStatus,
  resolveReservationStatusGroup,
} from "@/app/components/administrator/superadmin/reservationStatus";
import AdminReservationTable from "@/app/components/administrator/admin/AdminReservationTable";
import type { AdminReservationRecord, AdminRole } from "./types";

type AdminDashboardContentProps = {
  initialData: AdminReservationRecord[];
  adminRole: AdminRole;
  lastSync: string;
};

export default function AdminDashboardContent({ initialData, adminRole }: AdminDashboardContentProps) {
  const [tableData, setTableData] = useState<AdminReservationRecord[]>(initialData);

  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const item of tableData) {
      const computed = computeReservationStatus(item.status, item.endTime);
      const group = resolveReservationStatusGroup(computed);

      if (group === "PENDING") pending += 1;
      if (group === "REJECTED") rejected += 1;
      if (group === "APPROVED" || group === "COMPLETED") approved += 1;
    }

    return {
      pending,
      approved,
      rejected,
      total: tableData.length,
    };
  }, [tableData]);

  const handleStatusUpdated = (id: string, updates: Partial<AdminReservationRecord>) => {
    setTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  return (
    <main className="space-y-5 p-4 lg:p-7">
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pengajuan Pending"
          value={summary.pending}
          sublabel="Menunggu Persetujuan"
          color="amber"
          iconColor="amber"
        />
        <StatCard
          icon={CheckCircle}
          label="Pengajuan Diterima"
          value={summary.approved}
          sublabel={summary.approved > 0 ? "Telah Disetujui" : "Belum Ada"}
          color="emerald"
          iconColor="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Pengajuan Ditolak"
          value={summary.rejected}
          sublabel={summary.rejected > 0 ? "Telah Ditolak" : "Belum Ada"}
          color="rose"
          iconColor="rose"
        />
        <StatCard
          icon={FileText}
          label="Total Pengajuan"
          value={summary.total}
          sublabel="Semua Status"
          color="slate"
          iconColor="slate"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Pengajuan Masuk</h2>
          <p className="text-sm text-slate-500">Tinjau detail pengajuan lalu proses sesuai role.</p>
        </div>

        <AdminReservationTable data={tableData} adminRole={adminRole} onStatusUpdated={handleStatusUpdated} />
      </section>
    </main>
  );
}
