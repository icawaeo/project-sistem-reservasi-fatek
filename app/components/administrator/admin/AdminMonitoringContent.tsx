"use client";

import { useState } from "react";

import AdminReservationTable from "@/app/components/administrator/admin/AdminReservationTable";
import type { AdminReservationRecord, AdminRole } from "./types";

type AdminMonitoringContentProps = {
  initialData: AdminReservationRecord[];
  adminRole: AdminRole;
  lastSync: string;
};

export default function AdminMonitoringContent({ initialData, adminRole }: AdminMonitoringContentProps) {
  const [tableData, setTableData] = useState<AdminReservationRecord[]>(initialData);

  const handleStatusUpdated = (id: string, updates: Partial<AdminReservationRecord>) => {
    setTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  return (
    <main className="p-4 lg:p-7">
      <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Monitoring Pengajuan</h2>
          <p className="text-sm text-slate-500">Pantau, tinjau detail, lalu proses pengajuan.</p>
        </div>

        <AdminReservationTable data={tableData} adminRole={adminRole} onStatusUpdated={handleStatusUpdated} />
      </section>
    </main>
  );
}
