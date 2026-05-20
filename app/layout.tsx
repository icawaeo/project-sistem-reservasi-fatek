import type { Metadata, Viewport } from "next";
import "./globals.css";
import NextAuthProvider from "@/app/components/providers/NextAuthProvider";
import IdleLogoutProvider from "@/app/components/providers/IdleLogoutProvider";
import { ToastProvider } from "@/app/components/ui/toast";
import PWAProvider from "@/app/components/providers/PWAProvider";
import InstallPrompt from "@/app/components/pwa/InstallPrompt";
import OfflineIndicator from "@/app/components/pwa/OfflineIndicator";
import UpdateNotification from "@/app/components/pwa/UpdateNotification";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
};

export const metadata: Metadata = {
  title: "Reservasi Ruangan — Fakultas Teknik UNSRAT",
  description:
    "Sistem reservasi ruangan Fakultas Teknik Universitas Sam Ratulangi Manado. Lakukan pemesanan ruangan, cek ketersediaan jadwal, dan kelola penggunaan ruangan secara online.",
  manifest: "/manifest.json",
  applicationName: "Reservasi Fatek",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reservasi Fatek",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

import FcmInit from "@/app/FcmInit";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Reservasi Fatek" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512x512.png"
        />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body
        className="antialiased"
      >
        <NextAuthProvider>
          <ToastProvider>
            <IdleLogoutProvider>
              <PWAProvider>
                <FcmInit />
                {children}
                <InstallPrompt />
                <OfflineIndicator />
                <UpdateNotification />
              </PWAProvider>
            </IdleLogoutProvider>
          </ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
