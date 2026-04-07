import { Bell, Search } from "lucide-react";

type Role = "superadmin" | "admin";

type NavbarProps = {
  pageTitle: string;
  pageSubtitle: string;
  userName: string;
  userEmail?: string | null;
  role: Role;
};

const roleLabel: Record<Role, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
};

export default function Navbar({
  pageTitle,
  pageSubtitle,
  userName,
  userEmail,
  role,
}: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari data user, ruangan, atau kegiatan"
              className="h-14 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div> */}

          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell size={16} />
          </button>

          <div className="flex h-14 flex-col justify-center rounded-lg border border-slate-200 px-3">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            {userEmail ? <p className="text-[11px] text-slate-500">{userEmail}</p> : null}
            {/* <p className="text-[11px] uppercase tracking-wide text-slate-500">{roleLabel[role]}</p> */}
          </div>
        </div>
      </div>
    </header>
  );
}
