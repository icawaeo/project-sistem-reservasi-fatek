import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import DashboardContent from "@/app/components/administrator/dashboard/DashboardContent";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/monitoring-pengajuan/reservation-types";
import { isSuperadminUser, shouldShowAdminReservation } from "@/lib/admin-access";

export default async function AdminDashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
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

	const allRooms = await prisma.room.findMany({
		select: {
			room_building: true,
		},
	});

	const totalRooms = allRooms.length;
	const totalBuildings = new Set(allRooms.map((room) => room.room_building)).size;
	const totalUsers = await prisma.user.count();

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
						pageTitle="Dashboard Admin"
						pageSubtitle="Monitoring pengajuan peminjaman ruangan"
						userName={session.user.name || "Admin"}
						role="admin"
					/>

					<DashboardContent
						adminData={tableData}
						mode="admin"
						totalRooms={totalRooms}
						totalBuildings={totalBuildings}
						totalUsers={totalUsers}
						lastSync={lastSync}
						adminRole={adminRole}
					/>
				</div>
			</div>
		</div>
	);
}
