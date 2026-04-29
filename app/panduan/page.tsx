import Navbar from "@/app/components/layout/Navbar";
import PanduanPeminjamanContent from "@/app/components/user/PanduanPeminjamanContent";

export default function PanduanPage() {
	return (
		<div className="min-h-screen bg-white font-sans">
			<Navbar />

			<main className="mx-auto w-full max-w-4xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-7">
					<h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
						Panduan Peminjaman Ruangan
					</h1>
					<p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
						Halaman ini berisi panduan yang sama dengan tombol “Lihat Panduan” di navbar.
					</p>

					<div className="mt-6">
						<PanduanPeminjamanContent />
					</div>
				</div>
			</main>
		</div>
	);
}

