import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/app/components/administrator/Sidebar";
import Navbar from "@/app/components/administrator/Navbar";
import StatCard from "@/app/components/administrator/StatCard";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";

export default async function AdminDashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	const reservations = await prisma.reservation.findMany({
		orderBy: {
			res_date: "desc",
		},
		take: 100,
	});

	const totalPending = reservations.filter((item) => item.res_status.toUpperCase() === "PENDING").length;
	const totalApproved = reservations.filter((item) => item.res_status.toUpperCase() === "APPROVED").length;
	const totalRejected = reservations.filter((item) => item.res_status.toUpperCase() === "REJECTED").length;

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="admin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Dashboard Admin"
						pageSubtitle="Monitoring pengajuan peminjaman ruangan"
						userName={session.user.name || "Admin"}
						userEmail={session.user.email}
						role="admin"
					/>

					<main className="space-y-5 p-4 lg:p-7">
						<section className="grid gap-4 sm:grid-cols-4">
							<StatCard
								icon={FileText}
								label="Pengajuan Pending"
								value={totalPending}
								sublabel="Menunggu Persetujuan"
								color="amber"
								iconColor="amber"
							/>
							<StatCard
								icon={CheckCircle}
								label="Pengajuan Disetujui"
								value={totalApproved}
								sublabel={totalApproved > 0 ? "Telah Disetujui" : "Belum Ada"}
								color="emerald"
								iconColor="emerald"
							/>
							<StatCard
								icon={XCircle}
								label="Pengajuan Ditolak"
								value={totalRejected}
								sublabel={totalRejected > 0 ? "Telah Ditolak" : "Belum Ada"}
								color="rose"
								iconColor="rose"
							/>
							<StatCard
								icon={Clock}
								label="Total Pengajuan"
								value={reservations.length}
								sublabel="Semua Status"
								color="slate"
								iconColor="slate"
							/>
						</section>

						<section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
							<h2 className="text-base font-bold text-slate-900">Data Akun</h2>
							<p className="text-sm text-slate-500">Informasi akun admin yang sedang login.</p>

							<div className="mt-4 grid gap-3 sm:grid-cols-3">
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
									<p className="text-xs uppercase tracking-wide text-slate-500">Nama</p>
									<p className="mt-1 text-sm font-semibold text-slate-900">{session.user.name || "-"}</p>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
									<p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
									<p className="mt-1 text-sm font-semibold text-slate-900">{session.user.email || "-"}</p>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
									<p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
									<p className="mt-1 text-sm font-semibold text-slate-900">Admin</p>
								</div>
							</div>
						</section>
					</main>
				</div>
			</div>
		</div>
	);
}
