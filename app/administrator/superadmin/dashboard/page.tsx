import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/app/components/administrator/ui/SidebarClientOnly";
import Navbar from "@/app/components/administrator/ui/Navbar";
import DashboardContent from "@/app/components/administrator/dashboard/DashboardContent";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import { computeReservationStatus } from "@/app/components/administrator/ui/reservationStatus";
import { getReservationMinDaysAheadExclusive } from "@/lib/reservation-settings";

export const dynamic = "force-dynamic";

const splitReservationPurpose = (value: string | null) => {
	if (!value) {
		return { activityName: "-", purpose: "-" };
	}

	const [activityName, ...purposeParts] = value.split(" - ");
	const purpose = purposeParts.join(" - ").trim();

	return {
		activityName: activityName.trim() || "-",
		purpose: purpose || "-",
	};
};

type ReservationUserSnapshot = {
	name: string | null;
	userType: string | null;
	identifier: string | null;
	email: string | null;
} | null;

type SuperadminDashboardReservation = {
	res_purpose: string | null;
	res_status: string;
	res_endTime: Date;
	res_id: string;
	res_date: Date;
	res_startTime: Date;
	res_documentUrl: string | null;
	res_decisionDocumentUrl: string | null;
	user: ReservationUserSnapshot;
	room: {
		room_name: string;
		room_building: string | null;
		room_locDetail: string | null;
	};
};

const mapReservationUser = (user: ReservationUserSnapshot) => ({
	name: user?.name ?? "User terhapus",
	userType: (user?.userType ?? "USER") as "USER" | "STAFF",
	identifier: user?.identifier ?? null,
	email: user?.email ?? "-",
});

export default async function SuperadminDashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	const [reservations, minDaysAheadExclusive, buildings]: [
		SuperadminDashboardReservation[],
		number,
		Array<{ building_name: string }>,
	] = await Promise.all([
		prisma.reservation.findMany({
		include: {
			user: {
				select: {
					name: true,
					userType: true,
					identifier: true,
					email: true,
				},
			},
			room: {
				select: {
					room_name: true,
					room_building: true,
					room_locDetail: true,
				},
			},
		},
		orderBy: {
			res_date: "desc",
		},
		}),
		getReservationMinDaysAheadExclusive(),
		prisma.building.findMany({
			select: {
				building_name: true,
			},
			orderBy: {
				building_name: "asc",
			},
		}),
	]);

	// Fetch additional data for cards
	const allRooms = await prisma.room.findMany({
		select: {
			room_building: true,
		},
	});

	const totalRooms = allRooms.length;
	const totalBuildings = buildings.length;
	const buildingOptions = buildings.map((building: { building_name: string }) => building.building_name);

	const totalUsers = await prisma.user.count();

	const tableData: MonitoringReservation[] = reservations.map((item) => {
		const parsedPurpose = splitReservationPurpose(item.res_purpose);
		const computedStatus = computeReservationStatus(item.res_status, item.res_endTime);

		return {
		id: item.res_id,
		createdAt: item.res_date.toISOString(),
		startTime: item.res_startTime.toISOString(),
		endTime: item.res_endTime.toString(),
		activityName: parsedPurpose.activityName,
		purpose: parsedPurpose.purpose,
		status: computedStatus,
		documentUrl: item.res_documentUrl,
		decisionDocumentUrl: item.res_decisionDocumentUrl,
		user: mapReservationUser(item.user),
		room: {
			name: item.room.room_name,
			building: item.room.room_building ?? "-",
			location: item.room.room_locDetail ?? "-",
		},
		};
	});

	const lastSync = new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Makassar",
	}).format(new Date());

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="superadmin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Dashboard Superadmin"
						pageSubtitle="Monitoring pengajuan peminjaman ruangan"
						role="superadmin"
					/>

					<DashboardContent
						initialData={tableData}
						totalRooms={totalRooms}
						totalBuildings={totalBuildings}
						totalUsers={totalUsers}
						buildingOptions={buildingOptions}
						lastSync={lastSync}
						initialMinDaysAheadExclusive={minDaysAheadExclusive}
					/>
				</div>
			</div>
		</div>
	);
}
