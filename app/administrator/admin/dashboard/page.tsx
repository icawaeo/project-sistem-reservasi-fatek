import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/app/components/administrator/Sidebar";
import Navbar from "@/app/components/administrator/Navbar";
import AdminDashboardContent from "@/app/components/administrator/admin/AdminDashboardContent";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/admin/types";

export default async function AdminDashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	const role = (session.user.role || "ADMIN").toUpperCase();
	const adminRole: AdminRole = role === "ADMIN_DEKAN" || role === "ADMIN_WD2" ? (role as AdminRole) : "ADMIN";

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

	const tableData: AdminReservationRecord[] = reservations.map((item) => {
		const parsedPurpose = splitReservationPurpose(item.res_purpose);

		return {
			id: item.res_id,
			createdAt: item.res_date.toISOString(),
			processedAt: item.res_processedAt ? item.res_processedAt.toISOString() : null,
			waitingDekanAt: item.res_waitingDekanAt ? item.res_waitingDekanAt.toISOString() : null,
			waitingWd2At: item.res_waitingWd2At ? item.res_waitingWd2At.toISOString() : null,
			decisionAt: item.res_decisionAt ? item.res_decisionAt.toISOString() : null,
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
					/>

					<AdminDashboardContent initialData={tableData} adminRole={adminRole} lastSync={lastSync} />
				</div>
			</div>
		</div>
	);
}
