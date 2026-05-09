import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ children, className }: SectionCardProps) {
  const mergedClassName = `rounded-xl border border-slate-200 bg-white p-4 lg:p-5 ${className ?? ""}`.trim();

  return <section className={mergedClassName}>{children}</section>;
}
