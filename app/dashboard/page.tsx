"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  History, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  User as UserIcon
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-slate-900 grid place-items-center text-white font-bold text-xl">
            R
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">RoomTech</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Beranda" active />
          <SidebarItem icon={<CalendarCheck size={20} />} label="Reservasi Ruangan" />
          <SidebarItem icon={<History size={20} />} label="Riwayat" />
          <SidebarItem icon={<Settings size={20} />} label="Pengaturan" />
        </nav>

        <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 font-medium">
          <LogOut size={20} />
          Keluar
        </button>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari ruangan atau jadwal..." 
              className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{session?.user?.name || "User Name"}</p>
                <p className="text-xs text-slate-500 capitalize">{session?.user?.userType || "Mahasiswa"}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 grid place-items-center text-slate-600 border border-slate-300">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8">
          <header>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat Datang, {session?.user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1">Sistem Reservasi Ruangan Fakultas Teknik UNSRAT.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Reservasi" value="12" subtitle="Bulan ini" color="bg-blue-600" />
            <StatCard title="Menunggu" value="3" subtitle="Konfirmasi Admin" color="bg-amber-500" />
            <StatCard title="Ruangan Tersedia" value="24" subtitle="Hari ini" color="bg-emerald-600" />
          </div>

          <section className="bg-white rounded-4xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Informasi Cepat</h2>
            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-400">Belum ada aktivitas reservasi terbaru.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
      active 
      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, subtitle, color }: { title: string, value: string, subtitle: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex items-center gap-5"
    >
      <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-inner`}>
        <LayoutDashboard size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{value}</span>
          <span className="text-xs text-slate-400">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}