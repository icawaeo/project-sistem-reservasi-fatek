export default function PanduanPeminjamanContent() {
  return (
    <div className="space-y-6 text-slate-700">
      {/* <section className="space-y-2">
        <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800">
          Tujuan
        </h4>
        <p className="text-sm md:text-base leading-relaxed text-slate-600">
          Panduan ini membantu Anda melakukan peminjaman ruangan secara benar di sistem reservasi Fakultas Teknik.
          Ikuti langkah-langkah di bawah dan pastikan seluruh aturan dipatuhi agar pengajuan dapat diproses.
        </p>
      </section> */}

      <section className="space-y-3">
        <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800">
          Langkah-langkah Peminjaman
        </h4>

        <ol className="list-decimal space-y-2 pl-5 text-sm md:text-base leading-relaxed text-slate-700">
          <li>
            Buka <span className="font-semibold text-slate-800">Beranda</span>, pilih gedung, lalu pilih ruangan yang
            ingin dipinjam.
          </li>
          <li>
            Tentukan <span className="font-semibold text-slate-800">tanggal</span> dan
            <span className="font-semibold text-slate-800"> jam</span> peminjaman sesuai kebutuhan.
          </li>
          <li>
            Cek ketersediaan ruangan. Jika slot waktu bentrok, pilih jadwal lain atau ruangan lain.
          </li>
          <li>
            Setelah ruangan dipilih, Anda akan masuk ke halaman reservasi untuk mengisi
            <span className="font-semibold text-slate-800"> data peminjam</span> (nama, identitas, email, nomor HP).
          </li>
          <li>
            Isi <span className="font-semibold text-slate-800">detail kegiatan</span> (nama kegiatan dan alasan
            peminjaman) secara jelas dan ringkas.
          </li>
          <li>
            Unggah <span className="font-semibold text-slate-800">dokumen pendukung</span>:
            <div className="mt-1 space-y-1">
              <div>
                - Format: <span className="font-semibold">PDF/JPG/PNG</span> (maksimal <span className="font-semibold">5 MB</span>).
              </div>
              <div>
                - Untuk peminjaman lab kategori <span className="font-semibold">Skripsi</span>, siapkan dokumen
                <span className="font-semibold"> SK Pembimbingan</span>.
              </div>
              <div>
                - Untuk kategori lainnya, siapkan <span className="font-semibold">Surat Pengantar</span>.
              </div>
            </div>
          </li>
          <li>
            Klik <span className="font-semibold text-slate-800">Konfirmasi Reservasi</span>, periksa kembali ringkasan
            pengajuan, lalu kirim.
          </li>
          <li>
            Pantau status pengajuan melalui menu <span className="font-semibold text-slate-800">Riwayat</span>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800">
          Aturan yang Harus Dipatuhi
        </h4>

        <ul className="list-disc space-y-2 pl-5 text-sm md:text-base leading-relaxed text-slate-700">
          <li>
            Reservasi minimal <span className="font-semibold text-slate-800">H-3</span> dari tanggal peminjaman.
          </li>
          <li>
            Pilih jam peminjaman sesuai <span className="font-semibold text-slate-800">jam operasional gedung</span>.
            Sistem akan menolak jika jadwal melewati jam operasional.
          </li>
          <li>
            Pastikan data yang diisi benar (nama, NIM/NIP, email, nomor HP) agar mudah dihubungi bila ada verifikasi.
          </li>
          <li>
            Dokumen pendukung harus jelas dan relevan. Pengajuan dapat ditolak jika dokumen tidak sesuai.
          </li>
          <li>
            Gunakan ruangan sesuai tujuan yang diajukan, jaga kebersihan, dan tidak merusak fasilitas.
          </li>
          <li>
            Jika terjadi perubahan rencana, lakukan pengajuan ulang pada jadwal yang benar (atau hubungi pengelola jika
            diperlukan).
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800">Catatan</h4>
        <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
          Jika Anda belum login, sistem akan meminta Anda masuk terlebih dahulu sebelum melanjutkan peminjaman.
          Untuk peminjaman di <span className="font-semibold">Gedung Laboratorium Fakultas Teknik</span>, pastikan memilih
          kategori peminjaman (Skripsi/Lainnya) dan menyiapkan dokumen yang sesuai.
        </p>
      </section>
    </div>
  );
}
