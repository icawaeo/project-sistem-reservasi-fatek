import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Navbar from "@/app/components/layout/NavbarClient";
import { authOptions } from "@/lib/auth";

import type { ReservationRecord, SortOrder } from "../components/user/riwayat/_types";
import { getUserReservations, normalizeSortOrder } from "../components/user/lib/getUserReservations";
import RiwayatBreadcrumb from "../components/user/riwayat/RiwayatBreadcrumb";
import RiwayatClient from "../components/user/riwayat/RiwayatClient";
import RiwayatFooter from "../components/user/riwayat/RiwayatFooter";
import RiwayatHero from "../components/user/riwayat/RiwayatHero";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    sort?: string | string[];
  };
};

export default async function RiwayatPeminjamanPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.userType === "STAFF" || !session.user.id) {
    redirect("/?tab=login");
  }

  const sortOrder = normalizeSortOrder(searchParams?.sort);

  let reservations: ReservationRecord[] = [];
  try {
    reservations = await getUserReservations(session.user.id, sortOrder);
  } catch {
    reservations = [];
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Navbar />
      <RiwayatHero />

      <main className="w-full max-w-6xl mx-auto px-4 pt-8 pb-14 flex-1 sm:px-6 lg:px-8 xl:px-10">
        <RiwayatBreadcrumb />
        <RiwayatClient initialReservations={reservations} initialSort={sortOrder} />
      </main>

      <RiwayatFooter />
    </div>
  );
}
