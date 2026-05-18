"use client";

import { useMemo, useState } from "react";
import { Clock, Building2, DoorOpen, Users } from "lucide-react";
import StatCard from "@/app/components/administrator/ui/StatCard";
import DashboardStatGrid from "@/app/components/administrator/dashboard/DashboardStatGrid";
import SuperadminMonitoringContent from "@/app/components/administrator/monitoring-pengajuan/SuperadminMonitoringContent";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/monitoring-pengajuan/reservation-types";
import { computeReservationStatus, resolveReservationStatusGroup } from "@/app/components/administrator/ui/reservationStatus";

type DashboardContentProps = {
  initialData?: MonitoringReservation[];
  adminData?: AdminReservationRecord[];
  mode?: "superadmin" | "admin";
  totalRooms: number;
  totalBuildings: number;
  totalUsers: number;
  lastSync: string;
  adminRole?: AdminRole;
};

export default function DashboardContent({
  initialData = [],
  adminData = [],
  mode = "superadmin",
  totalRooms,
  totalBuildings,
  totalUsers,
  lastSync,
  adminRole = "ADMIN",
}: DashboardContentProps) {
  const [tableData, setTableData] = useState<MonitoringReservation[]>(initialData);
  const [adminTableData, setAdminTableData] = useState<AdminReservationRecord[]>(adminData);

  const totalPending = useMemo(() => {
    if (mode === "admin") {
      return adminTableData.reduce((count, item) => {
        const computed = computeReservationStatus(item.status, item.endTime);
        const group = resolveReservationStatusGroup(computed);
        return group === "PENDING" ? count + 1 : count;
      }, 0);
    }

    return tableData.filter((item) => item.status.toUpperCase() === "PENDING").length;
  }, [adminTableData, mode, tableData]);

  const handleAdminStatusUpdated = (id: string, updates: Partial<AdminReservationRecord>) => {
    setAdminTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  return (
    <main className="space-y-5 p-4 lg:p-7">
      <DashboardStatGrid>
        <StatCard
          icon={Clock}
          label="Total Pengajuan Tertunda"
          value={totalPending}
          sublabel="Menunggu Persetujuan"
          color="amber"
          iconColor="amber"
        />
        <StatCard
          icon={DoorOpen}
          label="Total Ruangan"
          value={totalRooms}
          sublabel="Ruang Aktif"
          color="blue"
          iconColor="blue"
        />
        <StatCard
          icon={Building2}
          label="Total Gedung"
          value={totalBuildings}
          sublabel="Gedung Aktif"
          color="blue"
          iconColor="blue"
        />
        <StatCard
          icon={Users}
          label="Total Pengguna"
          value={totalUsers}
          sublabel="Akun Terdaftar"
          color="blue"
          iconColor="blue"
        />
      </DashboardStatGrid>

      <SuperadminMonitoringContent
        initialData={tableData}
        adminData={adminTableData}
        lastSync={lastSync}
        adminMode={mode === "admin"}
        adminRole={adminRole}
        onDeleted={(deletedId) => setTableData((prev) => prev.filter((item) => item.id !== deletedId))}
      />
    </main>
  );
}
