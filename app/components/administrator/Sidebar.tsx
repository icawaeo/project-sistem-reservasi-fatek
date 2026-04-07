"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Building2,
  DoorOpen,
  Users,
  ClipboardList,
  History,
  FileText,
  LogOut,
} from "lucide-react";

type Role = "superadmin" | "admin";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type SidebarProps = {
  role: Role;
};

const navByRole: Record<Role, NavItem[]> = {
  superadmin: [
    {
      href: "/administrator/superadmin/dashboard",
      label: "Dashboard",
      icon: <LayoutGrid size={16} />,
    },
    {
      href: "/administrator/superadmin/kelola-ruangan",
      label: "Kelola Ruangan",
      icon: <DoorOpen size={16} />,
    },
    {
      href: "/administrator/superadmin/kelola-gedung",
      label: "Kelola Gedung",
      icon: <Building2 size={16} />,
    },
    {
      href: "/administrator/superadmin/kelola-user",
      label: "Kelola User",
      icon: <Users size={16} />,
    },
    {
      href: "/administrator/superadmin/monitoring-pengajuan",
      label: "Monitoring Pengajuan",
      icon: <ClipboardList size={16} />,
    },
    {
      href: "/administrator/superadmin/riwayat-pengajuan",
      label: "Riwayat Pengajuan",
      icon: <History size={16} />,
    },
    {
      href: "/administrator/superadmin/kelola-template-surat",
      label: "Template Surat",
      icon: <FileText size={16} />,
    },
  ],
  admin: [
    {
      href: "/administrator/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutGrid size={16} />,
    },
    {
      href: "/administrator/admin/monitoring-pengajuan",
      label: "Monitoring Pengajuan",
      icon: <ClipboardList size={16} />,
    },
    {
      href: "/administrator/admin/riwayat-pengajuan",
      label: "Riwayat Pengajuan",
      icon: <History size={16} />,
    },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navByRole[role];

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-extrabold text-slate-900">FAKULTAS TEKNIK</p>
        <p className="text-[11px] text-slate-500">UNIVERSITAS SAM RATULANGI</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
