import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import ProfileForm from "@/app/components/administrator/ui/ProfileForm";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
	searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdministratorProfilePage({ searchParams }: ProfilePageProps) {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (session.user.userType !== "STAFF") {
		redirect("/landingpage");
	}

	const user = await prisma.user.findUnique({
		where: {
			user_id: session.user.id,
		},
		select: {
			name: true,
			email: true,
			role: true,
			signatureUrl: true,
		},
	});

	if (!user) {
		redirect("/auth");
	}

	const isSuperadmin = isSuperadminUser(session.user);
	const sidebarRole = isSuperadmin ? "superadmin" : "admin";
	const emailChanged = searchParams?.emailChanged === "1";

	return (
		<div className="min-h-screen bg-slate-100">
			<div className={`flex min-h-screen ${isSuperadmin ? "" : "flex-col"}`}>
				{isSuperadmin ? <Sidebar role="superadmin" /> : null}

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Profil"
						pageSubtitle="Perbarui informasi akun administrator"
						role={sidebarRole}
					/>

					<main className="flex-1 p-4 lg:p-7">
						<div className="mx-auto w-full max-w-3xl">
							{!isSuperadmin ? (
								<Link
									href="/administrator/admin"
									className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
								>
									<ArrowLeft size={16} />
									Kembali
								</Link>
							) : null}

							<ProfileForm
								initialName={user.name}
								initialEmail={user.email}
								role={String(user.role)}
								initialSignatureUrl={user.signatureUrl}
								emailChanged={emailChanged}
							/>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
