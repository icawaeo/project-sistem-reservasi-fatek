"use client";

import { useMemo, useState } from "react";
import { Clock, Building2, DoorOpen, Users } from "lucide-react";
import StatCard from "@/app/components/administrator/StatCard";
import MonitoringSection from "./MonitoringSection";
import type { MonitoringReservation } from "./types";

type DashboardContentProps = {
  initialData: MonitoringReservation[];
  totalRooms: number;
  totalBuildings: number;
  totalUsers: number;
  lastSync: string;
};

export default function DashboardContent({
  initialData,
  totalRooms,
  totalBuildings,
  totalUsers,
  lastSync,
}: DashboardContentProps) {
  const [tableData, setTableData] = useState<MonitoringReservation[]>(initialData);

  const totalPending = useMemo(
    () => tableData.filter((item) => item.status.toUpperCase() === "PENDING").length,
    [tableData]
  );

  const handleDeleteSuccess = (deletedId: string) => {
    setTableData((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return (
    <main className="space-y-5 p-4 lg:p-7">
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Total Pengajuan Pending"
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
          label="Total User"
          value={totalUsers}
          sublabel="Akun Terdaftar"
          color="blue"
          iconColor="blue"
        />
      </section>

      <MonitoringSection
        data={tableData}
        lastSync={lastSync}
        primaryStatusLabel="Menunggu Persetujuan"
        onDeleteSuccess={handleDeleteSuccess}
      />
    </main>
  );
}
