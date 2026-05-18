import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { setReservationMinDaysAheadExclusive } from "@/lib/reservation-settings";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isSuperadminUser(session.user)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const minDaysAheadExclusive = Number(body?.minDaysAheadExclusive);

    if (!Number.isInteger(minDaysAheadExclusive) || minDaysAheadExclusive < 0 || minDaysAheadExclusive > 30) {
      return NextResponse.json({ error: "Nilai H-n harus berupa angka 0 sampai 30." }, { status: 400 });
    }

    const savedValue = await setReservationMinDaysAheadExclusive(minDaysAheadExclusive);
    return NextResponse.json({ minDaysAheadExclusive: savedValue });
  } catch (error) {
    logServerError("[api/admin/reservation-policy] Failed to update policy", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui aturan reservasi" }, { status: 500 });
  }
}
