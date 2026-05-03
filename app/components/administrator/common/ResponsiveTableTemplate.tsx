"use client";

import type { ReactNode } from "react";

/**
 * Konfigurasi kolom untuk desktop table
 */
export type TableColumn<T> = {
  /** ID unik untuk kolom */
  id: string;
  /** Label header kolom */
  label: string;
  /** Render cell content */
  render: (item: T) => ReactNode;
  /** Optional: Custom className untuk cell */
  className?: string;
};

/**
 * Konfigurasi mobile card field
 */
export type MobileCardField<T> = {
  /** Label untuk field */
  label: string;
  /** Render field content */
  render: (item: T) => ReactNode;
  /** Optional: Custom className */
  className?: string;
};

/**
 * Props untuk ResponsiveTableTemplate
 */
export type ResponsiveTableTemplateProps<T> = {
  /** Data yang akan ditampilkan */
  data: T[];
  /** Kolom untuk desktop table */
  columns: TableColumn<T>[];
  /** Konfigurasi mobile card (jika tidak disediakan, akan menggunakan semua kolom) */
  mobileFields?: MobileCardField<T>[];
  /** Render header mobile card (info baris pertama) */
  renderMobileHeader: (item: T) => ReactNode;
  /** Render footer mobile card (buttons/actions) - optional */
  renderMobileFooter?: (item: T) => ReactNode;
  /** Empty state content */
  renderEmptyState: () => ReactNode;
  /** Optional: Custom className untuk table container */
  tableClassName?: string;
  /** Optional: Custom className untuk grid mobile */
  gridClassName?: string;
  /** Optional: Custom className untuk article mobile */
  articleClassName?: string;
};

/**
 * Template generic untuk tabel responsive (desktop table + mobile card)
 * 
 * @example
 * ```tsx
 * <ResponsiveTableTemplate
 *   data={buildings}
 *   columns={[
 *     { id: "name", label: "Nama", render: (item) => item.name },
 *     { id: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
 *   ]}
 *   mobileFields={[
 *     { label: "Nama", render: (item) => item.name },
 *     { label: "Status", render: (item) => item.status },
 *   ]}
 *   renderMobileHeader={(item) => <div>{item.name}</div>}
 *   renderMobileFooter={(item) => <button>Edit</button>}
 *   renderEmptyState={() => <div>Belum ada data</div>}
 * />
 * ```
 */
export default function ResponsiveTableTemplate<T extends { id: string | number }>({
  data,
  columns,
  mobileFields,
  renderMobileHeader,
  renderMobileFooter,
  renderEmptyState,
  tableClassName = "hidden overflow-hidden rounded-xl border border-slate-200 lg:block",
  gridClassName = "grid gap-3 lg:hidden",
  articleClassName = "rounded-xl border border-slate-200 bg-white p-3",
}: ResponsiveTableTemplateProps<T>): ReactNode {
  if (data.length === 0) {
    return renderEmptyState();
  }

  // Default mobile fields: gunakan semua kolom (map columns ke mobile fields format)
  const effectiveMobileFields: MobileCardField<T>[] = mobileFields || columns.map((col) => ({ label: col.label, render: col.render, className: col.className }));

  return (
    <>
      {/* Desktop Table */}
      <div className={tableClassName}>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className={`px-4 py-3 font-semibold ${column.className || ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {data.map((item) => (
              <tr key={item.id}>
                {columns.map((column) => (
                  <td key={`${item.id}-${column.id}`} className={`px-4 py-3 ${column.className || ""}`}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid Card */}
      <div className={gridClassName}>
        {data.map((item) => (
          <article key={item.id} className={articleClassName}>
            {/* Header (rendered custom per data type) */}
            <div className="mb-3">{renderMobileHeader(item)}</div>

            {/* Fields Grid */}
            {effectiveMobileFields.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                {effectiveMobileFields.map((field, idx) => (
                  <div key={idx} className={field.className || "col-span-1"}>
                    {field.label && <p className="text-xs font-semibold text-slate-500">{field.label}</p>}
                    <p className="mt-0.5">{field.render(item)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer (actions/buttons) */}
            {renderMobileFooter && <div className="mt-3 border-t border-slate-100 pt-3">{renderMobileFooter(item)}</div>}
          </article>
        ))}
      </div>
    </>
  );
}
