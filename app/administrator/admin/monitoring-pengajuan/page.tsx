import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser, shouldShowAdminReservation } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/Sidebar";
import Navbar from "@/app/components/administrator/Navbar";
import SuperadminMonitoringContent from "@/app/components/administrator/superadmin/monitoring-pengajuan/SuperadminMonitoringContent";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/admin/types";

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

export default async function AdminMonitoringPengajuanPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (isSuperadminUser(session.user)) {
		redirect("/administrator/superadmin/monitoring-pengajuan");
	}

	const dbUser = await prisma.user.findUnique({
		where: { user_id: session.user.id },
		select: {
			role: true,
			departmentScope: true,
			programScope: true,
		},
	});

	if (!dbUser) {
		redirect("/auth");
	}

	const role = (dbUser.role || session.user.role || "ADMIN").toUpperCase();
	const adminRole: AdminRole =
		role === "ADMIN_DEKAN" || role === "ADMIN_WD2" || role === "KAJUR" || role === "KEPALA_LAB" ? (role as AdminRole) : "ADMIN";

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

	const visibleReservations = reservations.filter((item) =>
		shouldShowAdminReservation(
			{
				role: adminRole,
				departmentScope: dbUser.departmentScope,
				programScope: dbUser.programScope,
			},
			{
				flow: item.res_flow,
				status: item.res_status,
				labDepartment: item.res_labDepartment,
				labProgram: item.res_labProgram,
			},
		),
	);

	const tableData: AdminReservationRecord[] = visibleReservations.map((item) => {
		const parsedPurpose = splitReservationPurpose(item.res_purpose);

		return {
			id: item.res_id,
			createdAt: item.res_date.toISOString(),
			processedAt: item.res_processedAt ? item.res_processedAt.toISOString() : null,
			waitingDekanAt: item.res_waitingDekanAt ? item.res_waitingDekanAt.toISOString() : null,
			waitingWd2At: item.res_waitingWd2At ? item.res_waitingWd2At.toISOString() : null,
			waitingKajurAt: item.res_waitingKajurAt ? item.res_waitingKajurAt.toISOString() : null,
			waitingKepalaLabAt: item.res_waitingKepalaLabAt ? item.res_waitingKepalaLabAt.toISOString() : null,
			decisionAt: item.res_decisionAt ? item.res_decisionAt.toISOString() : null,
			flow: item.res_flow,
			startTime: item.res_startTime.toISOString(),
			endTime: item.res_endTime.toISOString(),
			activityName: parsedPurpose.activityName,
			purpose: parsedPurpose.purpose,
			rawPurpose: item.res_purpose || "-",
			status: item.res_status,
			documentUrl: item.res_documentUrl,
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

	const lastSync = new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Makassar",
	}).format(new Date());

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="admin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Monitoring Pengajuan"
						pageSubtitle="Pantau seluruh status pengajuan reservasi ruangan"
						userName={session.user.name || "Admin"}
					/>

					<SuperadminMonitoringContent
						adminData={tableData}
						lastSync={lastSync}
						adminMode={true}
						adminRole={adminRole}
					/>
				</div>
			</div>
		</div>
	);
}

