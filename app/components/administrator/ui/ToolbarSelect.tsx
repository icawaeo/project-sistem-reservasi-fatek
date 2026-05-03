"use client";

import type { ReactNode } from "react";

type Option = { value: string; label: string };

type ToolbarSelectProps<T extends string | number = string> = {
	label?: string;
	value: T;
	onChange: (v: T) => void;
	options: Option[];
	prefix?: ReactNode;
	className?: string;
	labelClassName?: string;
	selectClassName?: string;
};

export default function ToolbarSelect<T extends string | number = string>({
	label,
	value,
	onChange,
	options,
	prefix,
	className,
	labelClassName,
	selectClassName,
}: ToolbarSelectProps<T>) {
	return (
		<label className={className}>
			{prefix}
			{label ? <span className={labelClassName}>{label}</span> : null}
			<select
				value={String(value)}
				onChange={(e) => onChange(e.target.value as T)}
				className={selectClassName}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</label>
	);
}
