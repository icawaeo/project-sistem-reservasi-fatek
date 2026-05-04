import Link from "next/link";
import { Home } from "lucide-react";

export default function RiwayatBreadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] lg:text-xs text-slate-500 mb-5 px-1">
      <Link href="/landingpage" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
        <Home size={12} />
        Beranda
      </Link>
      <span>/</span>
      <span className="text-slate-800 font-medium truncate">Riwayat Peminjaman</span>
    </nav>
  );
}
