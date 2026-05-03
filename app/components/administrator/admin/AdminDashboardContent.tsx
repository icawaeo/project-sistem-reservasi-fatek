"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";

import StatCard from "@/app/components/administrator/superadmin/ui/StatCard";
import DashboardStatGrid from "@/app/components/administrator/dashboard/DashboardStatGrid";
import {
  computeReservationStatus,
  resolveReservationStatusGroup,
} from "@/app/components/administrator/reservations/reservationStatus";
import AdminReservationTable from "@/app/components/administrator/admin/AdminReservationTable";
import SectionCard from "@/app/components/administrator/common/SectionCard";
import SectionHeader from "@/app/components/administrator/common/SectionHeader";
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
      <DashboardStatGrid>
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
      </DashboardStatGrid>

      <SectionCard>
        <div className="mb-4">
          <SectionHeader
            title="Pengajuan Masuk"
            description="Tinjau detail pengajuan lalu proses sesuai role."
          />
        </div>

        <AdminReservationTable data={tableData} adminRole={adminRole} onStatusUpdated={handleStatusUpdated} />
      </SectionCard>
    </main>
  );
}
