"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Building2,
  DoorOpen,
  Users,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
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
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navByRole[role];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isExpanded = !isCollapsed;

  return (
    <aside
      className={`hidden h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex ${
        isExpanded ? "w-64" : "w-20"
      } motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      <div
        className={`flex items-center border-b border-slate-200 ${
          isExpanded ? "justify-between gap-3 px-5 py-5" : "justify-center px-3 py-5"
        } motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]`}
      >
        <div
          className={`flex min-w-0 items-center gap-3 overflow-hidden motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isExpanded ? "max-w-45 opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"
          }`}
        >
          <Image
            src="/images/Logo_Fatek_Unsrat.png"
            alt="Logo Fakultas Teknik Universitas Sam Ratulangi"
            width={38}
            height={38}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">FAKULTAS TEKNIK</p>
            <p className="text-[11px] text-slate-500">UNIVERSITAS SAM RATULANGI</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-900 ${
            isExpanded ? "opacity-100" : ""
          }`}
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          aria-pressed={isCollapsed}
        >
          <Menu size={18} className="transition-transform duration-500 ease-in-out" />
        </button>
      </div>

      <nav
        className={`flex-1 space-y-1 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded ? "px-3 py-4" : "px-2 py-4"
        }`}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center rounded-lg py-2.5 text-sm font-medium motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${isExpanded ? "gap-2.5 px-3 justify-start" : "justify-center px-2"}`}
            >
              {item.icon}
              <span
                className={`overflow-hidden whitespace-nowrap motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isExpanded ? "max-w-45 opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={`border-t border-slate-200 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded ? "px-3 py-4" : "px-2 py-4"
        }`}
      >
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Keluar"
          className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-red-600 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-red-50 ${
            isExpanded ? "gap-2.5 px-3 justify-start" : "justify-center px-2"
          }`}
        >
          <LogOut size={16} />
          <span
            className={`overflow-hidden whitespace-nowrap motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpanded ? "max-w-20 opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"
            }`}
          >
            Keluar
          </span>
        </button>
      </div>
    </aside>
  );
}
