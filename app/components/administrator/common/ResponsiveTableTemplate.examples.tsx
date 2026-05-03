/**
 * CONTOH PENGGUNAAN ResponsiveTableTemplate
 * 
 * Template generic untuk membuat tabel responsive yang otomatis:
 * - Desktop: Tampil sebagai tabel HTML biasa
 * - Mobile: Tampil sebagai grid card
 * 
 * Location: app/components/administrator/common/ResponsiveTableTemplate.tsx
 */

// ============================================================================
// CONTOH 1: Tabel Sederhana (Reservasi)
// ============================================================================

import ResponsiveTableTemplate, { type TableColumn, type MobileCardField } from "@/app/components/administrator/common/ResponsiveTableTemplate";
import { formatDateIdShort } from "@/app/components/administrator/common/datetime";

type Reservation = {
  id: string;
  roomName: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  requesterName: string;
};

export function ReservationTableExample({ data }: { data: Reservation[] }) {
  const columns: TableColumn<Reservation>[] = [
    {
      id: "room",
      label: "Ruangan",
      render: (item) => item.roomName,
    },
    {
      id: "date",
      label: "Tanggal",
      render: (item) => formatDateIdShort(item.date),
    },
    {
      id: "requester",
      label: "Pemohon",
      render: (item) => item.requesterName,
    },
    {
      id: "status",
      label: "Status",
      render: (item) => (
        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
          item.status === "approved" ? "bg-emerald-100 text-emerald-700" :
          item.status === "rejected" ? "bg-rose-100 text-rose-700" :
          "bg-amber-100 text-amber-700"
        }`}>
          {item.status === "approved" ? "Disetujui" : item.status === "rejected" ? "Ditolak" : "Menunggu"}
        </span>
      ),
    },
  ];

  const mobileFields: MobileCardField<Reservation>[] = [
    { label: "Tanggal", render: (item) => formatDateIdShort(item.date) },
    { label: "Waktu", render: (item) => item.time },
    { label: "Pemohon", render: (item) => item.requesterName },
    { label: "Status", render: (item) => item.status },
  ];

  return (
    <ResponsiveTableTemplate
      data={data}
      columns={columns}
      mobileFields={mobileFields}
      renderMobileHeader={(item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.roomName}</p>
          <p className="text-sm text-slate-500">{item.date} {item.time}</p>
        </div>
      )}
      renderMobileFooter={(item) => (
        <div className="flex gap-2">
          <button className="flex-1 px-2 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold">
            Detail
          </button>
          <button className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold">
            Ubah
          </button>
        </div>
      )}
      renderEmptyState={() => (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Belum ada reservasi</p>
          <p className="mt-1 text-sm text-slate-500">Tidak ada data reservasi untuk ditampilkan saat ini.</p>
        </div>
      )}
    />
  );
}

// ============================================================================
// CONTOH 2: Tabel dengan Custom Styling
// ============================================================================

type Document = {
  id: string;
  fileName: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
};

export function DocumentTableExample({ data }: { data: Document[] }) {
  const columns: TableColumn<Document>[] = [
    {
      id: "name",
      label: "Nama File",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">PDF</span>
          </div>
          <span className="font-medium text-slate-900">{item.fileName}</span>
        </div>
      ),
    },
    {
      id: "size",
      label: "Ukuran",
      render: (item) => `${(item.size / 1024).toFixed(2)} KB`,
      className: "text-right",
    },
    {
      id: "date",
      label: "Tanggal Upload",
      render: (item) => formatDateIdShort(item.uploadedDate),
    },
    {
      id: "by",
      label: "Diupload oleh",
      render: (item) => item.uploadedBy,
    },
  ];

  return (
    <ResponsiveTableTemplate
      data={data}
      columns={columns}
      renderMobileHeader={(item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.fileName}</p>
          <p className="text-xs text-slate-500">
            {(item.size / 1024).toFixed(2)} KB • {item.uploadedBy}
          </p>
        </div>
      )}
      renderEmptyState={() => (
        <div className="text-center py-8">
          <p className="text-slate-600">Tidak ada dokumen</p>
        </div>
      )}
    />
  );
}

// ============================================================================
// CONTOH 3: Tabel dengan Kompleks (seperti UniversalAdminTable)
// ============================================================================

type Student = {
  id: string;
  name: string;
  nim: string;
  email: string;
  major: string;
  enrollmentDate: string;
  status: "active" | "inactive";
};

export function StudentTableExample({ data }: { data: Student[] }) {
  const columns: TableColumn<Student>[] = [
    {
      id: "name",
      label: "Nama",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.nim}</p>
        </div>
      ),
    },
    { id: "email", label: "Email", render: (item) => item.email },
    { id: "major", label: "Program Studi", render: (item) => item.major },
    {
      id: "status",
      label: "Status",
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          item.status === "active"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-700"
        }`}>
          {item.status === "active" ? "Aktif" : "Tidak Aktif"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Aksi",
      render: (item) => (
        <div className="flex gap-1">
          <button className="p-2 hover:bg-slate-100 rounded text-sm">✎</button>
          <button className="p-2 hover:bg-rose-50 rounded text-sm text-rose-600">🗑</button>
        </div>
      ),
    },
  ];

  const mobileFields: MobileCardField<Student>[] = [
    { label: "NIM", render: (item) => item.nim },
    { label: "Email", render: (item) => item.email },
    { label: "Program Studi", render: (item) => item.major },
    { label: "Status", render: (item) => item.status === "active" ? "Aktif" : "Tidak Aktif" },
  ];

  return (
    <ResponsiveTableTemplate
      data={data}
      columns={columns}
      mobileFields={mobileFields}
      renderMobileHeader={(item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-sm text-slate-500">{item.email}</p>
        </div>
      )}
      renderMobileFooter={(item) => (
        <div className="flex gap-2">
          <button className="flex-1 px-2 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100">
            Edit
          </button>
          <button className="flex-1 px-2 py-1.5 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50">
            Hapus
          </button>
        </div>
      )}
      renderEmptyState={() => (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Belum ada data mahasiswa</p>
          <p className="mt-1 text-sm text-slate-500">Tambahkan mahasiswa pertama untuk memulai.</p>
        </div>
      )}
    />
  );
}

// ============================================================================
// KEUNTUNGAN MENGGUNAKAN ResponsiveTableTemplate
// ============================================================================

/**
 * 1. ✅ DRY (Don't Repeat Yourself)
 *    - Tidak perlu menulis desktop table + mobile grid terpisah
 *    - Cukup konfigurasi sekali, otomatis responsive
 *
 * 2. ✅ Tipe-Safe
 *    - Generic type <T> menjamin tipe data yang konsisten
 *    - IDE autocomplete untuk render functions
 *
 * 3. ✅ Customizable
 *    - Column render: render apa saja (text, badge, button, custom component)
 *    - Mobile fields: pilih kolom apa yang ditampilkan di mobile
 *    - Mobile header/footer: customize layout card di mobile
 *    - Empty state: custom message dan styling
 *
 * 4. ✅ Konsisten dengan design system
 *    - Sama styling dengan UniversalAdminTable
 *    - Grid layout mobile yang responsive
 *    - Desktop/mobile breakpoint di lg: (768px)
 *
 * 5. ✅ Mudah di-maintain
 *    - Semua logic responsive di satu tempat
 *    - Perubahan styling hanya di template
 *    - Jika perlu perubahan behavior, update ResponsiveTableTemplate
 */
