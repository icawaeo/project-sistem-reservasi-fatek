import type { Metadata, Viewport } from "next";
import "./globals.css";
import NextAuthProvider from "@/app/components/providers/NextAuthProvider";
import IdleLogoutProvider from "@/app/components/providers/IdleLogoutProvider";
import { ToastProvider } from "@/app/components/ui/toast";
import ServiceWorkerCleanup from "@/app/components/providers/ServiceWorkerCleanup";
import FcmInit from "@/app/FcmInit";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Reservasi Ruangan — Fakultas Teknik UNSRAT",
  description:
    "Sistem reservasi ruangan Fakultas Teknik Universitas Sam Ratulangi Manado. Lakukan pemesanan ruangan, cek ketersediaan jadwal, dan kelola penggunaan ruangan secara online.",
  applicationName: "Reservasi Fatek",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className="antialiased"
      >
        <NextAuthProvider>
          <ToastProvider>
            <IdleLogoutProvider>
              <ServiceWorkerCleanup />
              <FcmInit />
              {children}
            </IdleLogoutProvider>
          </ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
