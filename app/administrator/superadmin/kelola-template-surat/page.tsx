import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/Sidebar";
import Navbar from "@/app/components/administrator/Navbar";
import TemplateSuratManagementContent, {
	type TemplateSummary,
} from "@/app/components/administrator/superadmin/TemplateSuratManagementContent";
import { listTemplates } from "@/lib/template-store";

export default async function SuperadminKelolaTemplateSuratPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin/dashboard");
	}

	const templates = await listTemplates();
	const initialTemplates: TemplateSummary[] = templates.map((item) => ({
		id: item.id,
		name: item.name,
		originalFilename: item.originalFilename,
		pdfOriginalFilename: item.pdfOriginalFilename ?? null,
		hasPdfPreview: Boolean(item.pdfStoredPath),
		fileSize: item.fileSize,
		placeholders: item.placeholders,
		isActive: item.isActive,
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
	}));

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="superadmin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Kelola Template Surat"
						pageSubtitle="Upload template .docx dan tinjau preview PDF hasil konversi LibreOffice"
						userName={session.user.name || "Superadmin"}
					/>

					<TemplateSuratManagementContent initialTemplates={initialTemplates} />
				</div>
			</div>
		</div>
	);
}

