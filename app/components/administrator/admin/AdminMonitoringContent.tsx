"use client";

import { useState } from "react";

import AdminReservationTable from "@/app/components/administrator/admin/AdminReservationTable";
import SectionCard from "@/app/components/administrator/common/SectionCard";
import SectionHeader from "@/app/components/administrator/common/SectionHeader";
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
      <SectionCard>
        <div className="mb-4">
          <SectionHeader
            title="Monitoring Pengajuan"
            description="Pantau, tinjau detail, lalu proses pengajuan."
          />
        </div>

        <AdminReservationTable data={tableData} adminRole={adminRole} onStatusUpdated={handleStatusUpdated} />
      </SectionCard>
    </main>
  );
}
