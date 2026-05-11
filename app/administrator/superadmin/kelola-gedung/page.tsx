import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import BuildingManagementContent from "@/app/components/administrator/kelola-gedung/BuildingManagementContent";
import type { BuildingItem } from "@/app/components/administrator/kelola-gedung/building-types";

export const dynamic = "force-dynamic";

export default async function SuperadminKelolaGedungPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin");
	}

	const buildings = await prisma.building.findMany({
		orderBy: {
			building_name: "asc",
		},
	});

	const initialBuildings: BuildingItem[] = buildings.map((building: { building_id: any; building_name: any; operational_days: any; open_time: any; close_time: any; building_imageUrl: any; building_isActive: any; }) => ({
		id: building.building_id,
		name: building.building_name,
		operationalDays: building.operational_days,
		openTime: building.open_time,
		closeTime: building.close_time,
		imageUrl: building.building_imageUrl,
		status: building.building_isActive ? "aktif" : "maintenance",
	}));

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="superadmin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Kelola Gedung"
						pageSubtitle="Manajemen data gedung dan jadwal operasional"
					/>

					<BuildingManagementContent initialBuildings={initialBuildings} />
				</div>
			</div>
		</div>
	);
}
