import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Navbar from "@/app/components/administrator/ui/Navbar";
import Sidebar from "@/app/components/administrator/ui/SidebarClientOnly";
import ScheduleManagementClientOnly from "@/app/components/administrator/kelola-jadwal/ScheduleManagementClientOnly";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperadminUser } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.userType !== "STAFF") {
    redirect("/landingpage");
  }

  if (isSuperadminUser(session.user)) {
    redirect("/administrator/superadmin/dashboard");
  }

  const dbUser = await prisma.user.findUnique({
    where: { user_id: session.user.id },
    select: {
      role: true,
      programScope: true,
    },
  });

  if (!dbUser || (dbUser.role !== "KAJUR" && dbUser.role !== "KAPRODI")) {
    redirect("/administrator/admin");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar role="admin" />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            pageTitle="Kelola Jadwal"
            pageSubtitle="Manajemen jadwal akademik dan penggunaan rutin ruangan"
            role="admin"
            showSidebar
          />

          <ScheduleManagementClientOnly adminRole={dbUser.role} programScope={dbUser.programScope} />
        </div>
      </div>
    </div>
  );
}
