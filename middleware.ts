export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/riwayat-peminjaman/:path*",
    "/administrator/:path*",
  ],
};
