import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Navbar from "@/app/components/administrator/ui/Navbar";
import Sidebar from "@/app/components/administrator/ui/SidebarClientOnly";
import ScheduleManagementContent from "@/app/components/administrator/kelola-jadwal/ScheduleManagementContent";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function SuperadminSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  if (!isSuperadminUser(session.user)) {
    redirect("/administrator/admin");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar role="superadmin" />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            pageTitle="Kelola Jadwal"
            pageSubtitle="Manajemen jadwal akademik dan penggunaan rutin ruangan"
            role="superadmin"
          />

          <ScheduleManagementContent adminRole="SUPERADMIN" programScope={null} />
        </div>
      </div>
    </div>
  );
}
