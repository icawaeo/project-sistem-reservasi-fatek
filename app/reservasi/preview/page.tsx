"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type PreviewData = {
  dataUrl: string;
  name: string;
};

type ReservationDraftLike = {
  documentDataUrl?: string | null;
  documentName?: string;
  documentType?: string | null;
};

type PreviewMessage =
  | {
      type: "RESERVASI_PREVIEW_READY";
    }
  | {
      type: "RESERVASI_PREVIEW_DOCUMENT";
      dataUrl: string;
      name: string;
    };

function inferMimeType(input: { dataUrl?: string; documentType?: string | null }) {
  if (typeof input.documentType === "string" && input.documentType.length > 0) {
    return input.documentType;
  }
  const dataUrl = input.dataUrl;
  if (typeof dataUrl !== "string") return "";
  if (!dataUrl.startsWith("data:")) return "";
  const semiIndex = dataUrl.indexOf(";");
  const commaIndex = dataUrl.indexOf(",");
  const cutIndex = semiIndex === -1 ? commaIndex : Math.min(semiIndex, commaIndex);
  if (cutIndex === -1) return "";
  return dataUrl.slice("data:".length, cutIndex);
}

let hasHydrated = false;
const hydrateListeners = new Set<() => void>();

function subscribeHydration(listener: () => void) {
  hydrateListeners.add(listener);

  if (!hasHydrated && typeof window !== "undefined") {
    hasHydrated = true;
    queueMicrotask(() => {
      for (const cb of hydrateListeners) cb();
    });
  }

  return () => {
    hydrateListeners.delete(listener);
  };
}

function getHydrationSnapshot() {
  return hasHydrated;
}

function getHydrationServerSnapshot() {
  return false;
}

function useHydrated() {
  return useSyncExternalStore(subscribeHydration, getHydrationSnapshot, getHydrationServerSnapshot);
}

export default function PreviewPage() {
  const hydrated = useHydrated();

  const origin = hydrated ? window.location.origin : "";
  const hasOpener = hydrated && window.opener != null;

  const initialPreview = useMemo(() => {
    if (!hydrated) return { preview: null as PreviewData | null, mime: "" };

    let initial: PreviewData | null = null;
    let initialMime = "";

    const stored = sessionStorage.getItem("previewDocumentData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreviewData;
        if (parsed?.dataUrl) {
          initial = parsed;
          initialMime = inferMimeType({ dataUrl: parsed.dataUrl });
        }
      } catch {
        // ignore and fallback
      }
    }

    if (!initial) {
      const draftRaw = sessionStorage.getItem("reservationDraft");
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw) as ReservationDraftLike;
          const dataUrl = draft?.documentDataUrl;
          if (typeof dataUrl === "string" && dataUrl.length > 0) {
            initial = { dataUrl, name: draft?.documentName || "Dokumen" };
            initialMime = inferMimeType({ dataUrl, documentType: draft?.documentType });
          }
        } catch {
          // ignore
        }
      }
    }

    return { preview: initial, mime: initialMime };
  }, [hydrated]);

  const [previewOverride, setPreviewOverride] = useState<PreviewData | null | undefined>(undefined);
  const [mimeOverride, setMimeOverride] = useState<string | undefined>(undefined);

  const previewData = previewOverride !== undefined ? previewOverride : initialPreview.preview;
  const mimeType = mimeOverride ?? initialPreview.mime;

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [objectUrlStatus, setObjectUrlStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  useEffect(() => {
    if (!hydrated) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;

      const data = event.data as PreviewMessage | undefined;
      if (!data || data.type !== "RESERVASI_PREVIEW_DOCUMENT") return;

      if (typeof data.dataUrl !== "string" || data.dataUrl.length === 0) {
        setPreviewOverride(null);
        setMimeOverride("");
        return;
      }

      setPreviewOverride({ dataUrl: data.dataUrl, name: data.name || "Dokumen" });
      setMimeOverride(inferMimeType({ dataUrl: data.dataUrl }));
    };

    window.addEventListener("message", onMessage);

    // Let the opener know we're ready to receive the payload.
    try {
      window.opener?.postMessage(({ type: "RESERVASI_PREVIEW_READY" } satisfies PreviewMessage), origin);
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [hydrated, origin]);

  useEffect(() => {
    let alive = true;
    let urlToRevoke: string | null = null;

    const buildObjectUrl = async () => {
      if (!previewData?.dataUrl) {
        setObjectUrl(null);
        setObjectUrlStatus("idle");
        return;
      }

      try {
        setObjectUrlStatus("loading");
        const response = await fetch(previewData.dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlToRevoke = url;

        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }

        if (!mimeType && blob.type) {
          setMimeOverride(blob.type);
        }
        setObjectUrl(url);
        setObjectUrlStatus("ready");
        document.title = previewData.name || "Preview Dokumen";
      } catch {
        if (!alive) return;
        setObjectUrl(null);
        setObjectUrlStatus("failed");
      }
    };

    void buildObjectUrl();

    return () => {
      alive = false;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [previewData, mimeType]);

  if (!hydrated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "12px", fontSize: "clamp(14px, 1.2vw, 18px)" }}>
            Memuat preview dokumen...
          </p>
          <p style={{ fontSize: "clamp(12px, 1.1vw, 16px)", color: "#cbd5e1" }}>
            Jika tidak muncul, kembali ke konfirmasi lalu coba lagi.
          </p>
        </div>
      </div>
    );
  }

  const isWaitingForPayload = !previewData && hasOpener;

  if (isWaitingForPayload) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "12px", fontSize: "clamp(14px, 1.2vw, 18px)" }}>
            Memuat preview dokumen...
          </p>
          <p style={{ fontSize: "clamp(12px, 1.1vw, 16px)", color: "#cbd5e1" }}>
            Jika tidak muncul, kembali ke konfirmasi lalu coba lagi.
          </p>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "12px", fontSize: "clamp(14px, 1.2vw, 18px)" }}>Dokumen tidak ditemukan di sessionStorage.</p>
          <p style={{ fontSize: "clamp(12px, 1.1vw, 16px)", color: "#cbd5e1" }}>Silakan kembali ke halaman konfirmasi dan coba preview lagi.</p>
        </div>
      </div>
    );
  }

  const displayUrl = objectUrl || previewData.dataUrl;
  const effectiveMime = mimeType || inferMimeType({ dataUrl: previewData.dataUrl });
  const isPdf = effectiveMime === "application/pdf";
  const isImage = typeof effectiveMime === "string" && effectiveMime.startsWith("image/");

  if (previewData && objectUrlStatus === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "12px", fontSize: "clamp(14px, 1.2vw, 18px)" }}>
            Menyiapkan preview dokumen...
          </p>
          <p style={{ fontSize: "clamp(12px, 1.1vw, 16px)", color: "#cbd5e1" }}>
            File besar bisa butuh beberapa detik.
          </p>
        </div>
      </div>
    );
  }

  if (previewData && objectUrlStatus === "failed") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "640px", padding: "0 16px" }}>
          <p style={{ marginBottom: "12px", fontSize: "clamp(14px, 1.2vw, 18px)" }}>
            Preview gagal diproses.
          </p>
          <p style={{ fontSize: "clamp(12px, 1.1vw, 16px)", color: "#cbd5e1" }}>
            Silakan kembali ke halaman konfirmasi lalu coba preview lagi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, height: "100vh", backgroundColor: "#fff" }}>
      {isPdf ? (
        <iframe
          src={displayUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title={previewData.name}
        />
      ) : isImage ? (
        <img
          src={displayUrl}
          alt={previewData.name}
          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#0f172a" }}
        />
      ) : (
        <iframe
          src={displayUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title={previewData.name}
        />
      )}
    </div>
  );
}
