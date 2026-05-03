"use client";

import type { ReactNode } from "react";

type Option<T extends string> = {
  value: T;
  label: string;
};

type ToolbarSelectProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  prefix?: ReactNode;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
};

export default function ToolbarSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  prefix,
  className,
  labelClassName,
  selectClassName,
}: ToolbarSelectProps<T>) {
  const wrapperClassName = (
    className ??
    "inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
  ).trim();

  const mergedSelectClassName = (selectClassName ?? "bg-transparent text-sm font-semibold outline-none").trim();

  return (
    <label className={wrapperClassName}>
      {prefix}
      <span className={labelClassName}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={mergedSelectClassName}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
