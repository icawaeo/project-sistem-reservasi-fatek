"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";

type ImageUploadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
};

export default function ImageUpload({ value, onChange, label = "Foto Ruangan" }: ImageUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>

      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100">
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <span className="inline-flex items-center gap-2">
          <ImagePlus size={16} />
          Upload Gambar
        </span>
      </label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative h-44 w-full">
            <Image src={value} alt="Preview foto ruangan" fill className="object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-rose-600 shadow-sm transition-colors hover:bg-white"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      ) : null}
    </div>
  );
}
