"use client";

import type { ReactNode } from "react";
import SectionCard from "@/app/components/administrator/common/SectionCard";

function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(" ");
}

export function SuperAdminTableCard({ children, className }: { children: ReactNode; className?: string }) {
	return <SectionCard className={className}>{children}</SectionCard>;
}

export function SuperAdminTableScroll({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cx("overflow-x-auto", className)}>{children}</div>;
}

export function SuperAdminTable({ children, className }: { children: ReactNode; className?: string }) {
	return <table className={cx("w-full border-collapse text-left", className)}>{children}</table>;
}

export function SuperAdminTableBody({ children, className }: { children: ReactNode; className?: string }) {
	return <tbody className={cx("divide-y divide-slate-100 dark:divide-slate-800", className)}>{children}</tbody>;
}

export function SuperAdminTableMessageRow({
	colSpan,
	children,
	className,
}: {
	colSpan: number;
	children: ReactNode;
	className?: string;
}) {
	return (
		<tr>
			<td
				colSpan={colSpan}
				className={cx("px-6 py-6 text-sm font-medium text-slate-500 dark:text-slate-400", className)}
			>
				{children}
			</td>
		</tr>
	);
}

export default SuperAdminTable;
