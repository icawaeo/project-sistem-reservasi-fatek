import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import SuperadminMonitoringContent from "@/app/components/administrator/monitoring-pengajuan/SuperadminMonitoringContent";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import { computeReservationStatus } from "@/app/components/administrator/ui/reservationStatus";

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

export default async function SuperadminMonitoringPengajuanPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin/dashboard");
	}

	const reservations = await prisma.reservation.findMany({
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

	const tableData: MonitoringReservation[] = reservations.map((item: { res_purpose: string | null; res_status: string; res_endTime: string | Date; res_id: any; res_date: { toISOString: () => any; }; res_startTime: { toISOString: () => any; }; res_documentUrl: any; user: { name: any; userType: any; identifier: any; email: any; }; room: { room_name: any; room_building: any; room_locDetail: any; }; }) => {
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
		decisionDocumentUrl: computedStatus === "PENDING" ? null : item.res_documentUrl,
		user: {
			name: item.user.name,
			userType: item.user.userType,
			identifier: item.user.identifier,
			email: item.user.email,
		},
		room: {
			name: item.room.room_name,
			building: item.room.room_building,
			location: item.room.room_locDetail,
		},
		};
	});

	const activeBuildings = await prisma.building.findMany({
		where: {
			building_isActive: true,
		},
		select: {
			building_name: true,
		},
		orderBy: {
			building_name: "asc",
		},
	});

	const buildingOptions = activeBuildings.map((building: { building_name: any; }) => building.building_name).filter(Boolean);

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
