import nextAuthMiddleware from "next-auth/middleware";

export default nextAuthMiddleware;

export const config = {
  matcher: [
    "/riwayat-peminjaman/:path*",
    "/administrator/:path*",
  ],
};
