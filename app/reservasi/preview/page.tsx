"use client";

import { useEffect, useState } from "react";

type PreviewData = {
  dataUrl: string;
  name: string;
};

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("previewDocumentData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreviewData;
        setPreviewData(parsed);
      } catch {
        setPreviewData(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!previewData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "12px" }}>Dokumen tidak ditemukan di sessionStorage.</p>
          <p style={{ fontSize: "12px", color: "#cbd5e1" }}>Silakan kembali ke halaman konfirmasi dan coba preview lagi.</p>
        </div>
      </div>
    );
  }

  const isPdf = typeof previewData.dataUrl === "string" && previewData.dataUrl.indexOf("data:application/pdf") === 0;

  return (
    <div style={{ margin: 0, height: "100vh", backgroundColor: "#fff" }}>
      {isPdf ? (
        <object
          data={previewData.dataUrl}
          type="application/pdf"
          style={{ width: "100%", height: "100%" }}
          title={previewData.name}
        />
      ) : (
        <iframe
          src={previewData.dataUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title={previewData.name}
        />
      )}
    </div>
  );
}
