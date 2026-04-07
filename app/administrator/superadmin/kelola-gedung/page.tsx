import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/Sidebar";
import Navbar from "@/app/components/administrator/Navbar";
import BuildingManagementContent from "@/app/components/administrator/superadmin/BuildingManagementContent";

export default async function SuperadminKelolaGedungPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin/dashboard");
	}

	const buildings = await prisma.building.findMany({
		orderBy: {
			building_name: "asc",
		},
	});

	const initialBuildings = buildings.map((building) => ({
		id: building.building_id,
		name: building.building_name,
		operationalDays: building.operational_days,
		openTime: building.open_time,
		closeTime: building.close_time,
	}));

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="superadmin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Kelola Gedung"
						pageSubtitle="Manajemen data gedung dan jadwal operasional"
						userName={session.user.name || "Superadmin"}
						userEmail={session.user.email}
						role="superadmin"
					/>

					<BuildingManagementContent initialBuildings={initialBuildings} />
				</div>
			</div>
		</div>
	);
}
