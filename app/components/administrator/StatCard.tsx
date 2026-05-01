import { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  sublabel?: string;
  color?: "blue" | "amber" | "emerald" | "rose" | "slate";
  iconColor?: "blue" | "amber" | "emerald" | "rose" | "slate";
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md md:p-4">
      {Icon && (
        <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[#64748B] ring-1 ring-slate-200/80">
          <Icon size={16} />
        </div>
      )}

      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B] md:text-xs">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold leading-none tracking-tight whitespace-nowrap text-[#0F172A] md:text-[1.75rem]">
        {value}
      </p>

      {sublabel && <p className="mt-1.5 text-[11px] font-medium text-[#64748B] md:text-xs">{sublabel}</p>}
    </div>
  );
}
