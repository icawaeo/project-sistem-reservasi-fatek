import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/ui/SidebarClientOnly";
import Navbar from "@/app/components/administrator/ui/Navbar";
import SuperadminMonitoringContent from "@/app/components/administrator/monitoring-pengajuan/SuperadminMonitoringContent";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import { computeReservationStatus } from "@/app/components/administrator/ui/reservationStatus";

export const dynamic = "force-dynamic";

type SuperadminReservation = {
	res_purpose: string | null;
	res_status: string;
	res_endTime: Date | string;
	res_id: string;
	res_date: Date;
	res_startTime: Date;
	res_documentUrl: string | null;
	res_decisionDocumentUrl: string | null;
	user: {
		name: string | null;
		userType: string | null;
		identifier: string | null;
		email: string | null;
	} | null;
	room: {
		room_name: string;
		room_building: string | null;
		room_locDetail: string | null;
	};
};

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

const mapReservationUser = (user: SuperadminReservation["user"]) => ({
	name: user?.name ?? "User terhapus",
	userType: (user?.userType ?? "USER") as "USER" | "STAFF",
	identifier: user?.identifier ?? null,
	email: user?.email ?? "-",
});

export default async function SuperadminMonitoringPengajuanPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin");
	}

	const reservations: SuperadminReservation[] = await prisma.reservation.findMany({
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
	});

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

	const buildings: Array<{ building_name: string }> = await prisma.building.findMany({
		select: {
			building_name: true,
		},
		orderBy: {
			building_name: "asc",
		},
	});

	const buildingOptions: string[] = buildings.map((building) => building.building_name);

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
						pageTitle="Monitoring Pengajuan"
						pageSubtitle="Pantau seluruh status pengajuan reservasi ruangan"
					/>

					<SuperadminMonitoringContent
						initialData={tableData}
						buildingOptions={buildingOptions}
						lastSync={lastSync}
					/>
				</div>
			</div>
		</div>
	);
}
