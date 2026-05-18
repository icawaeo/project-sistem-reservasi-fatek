import { NextResponse } from "next/server";

import { getReservationMinDaysAheadExclusive } from "@/lib/reservation-settings";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const minDaysAheadExclusive = await getReservationMinDaysAheadExclusive();
    return NextResponse.json(
      { minDaysAheadExclusive },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    logServerError("[api/reservation-policy] Failed to load policy", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil aturan reservasi" }, { status: 500 });
  }
}
