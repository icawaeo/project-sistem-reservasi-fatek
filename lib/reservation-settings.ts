import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE } from "@/lib/reservation-policy";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";

const RESERVATION_MIN_DAYS_AHEAD_KEY = "reservation_min_days_ahead_exclusive";

const normalizeMinDaysAheadExclusive = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
    return DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE;
  }

  return parsed;
};

export const getReservationMinDaysAheadExclusive = async () => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: RESERVATION_MIN_DAYS_AHEAD_KEY },
      select: { value: true },
    });

    return normalizeMinDaysAheadExclusive(setting?.value);
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2021") {
      return DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE;
    }

    throw error;
  }
};

export const setReservationMinDaysAheadExclusive = async (value: number) => {
  const normalizedValue = normalizeMinDaysAheadExclusive(value);

  await prisma.appSetting.upsert({
    where: { key: RESERVATION_MIN_DAYS_AHEAD_KEY },
    update: { value: String(normalizedValue) },
    create: {
      key: RESERVATION_MIN_DAYS_AHEAD_KEY,
      value: String(normalizedValue),
    },
  });

  return normalizedValue;
};
