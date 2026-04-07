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
    <div className="relative rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
      {/* Icon on the right */}
      {Icon && (
        <div className="absolute right-4 top-4 lg:right-5 lg:top-5">
          <Icon size={24} className="text-[#64748B]" />
        </div>
      )}

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>

      {/* Value */}
      <p className="mt-3 text-3xl font-bold text-[#0F172A]">{value}</p>

      {/* Sublabel */}
      {sublabel && <p className="mt-2 text-sm font-medium text-[#64748B]">{sublabel}</p>}
    </div>
  );
}
