"use client";

import type { ReactNode } from "react";

function EmptyStateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

type AdminTableProps = {
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: ReactNode;
};

export default function AdminTable({ isEmpty = false, emptyTitle, emptyDescription, children }: AdminTableProps) {
  if (isEmpty) {
    return <EmptyStateCard title={emptyTitle || "Belum ada data"} description={emptyDescription || "Belum ada data untuk ditampilkan."} />;
  }

  return <>{children}</>;
}

export { EmptyStateCard };
