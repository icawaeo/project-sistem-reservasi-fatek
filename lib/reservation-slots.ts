export const RESERVATION_BUFFER_MS = 2 * 60 * 60 * 1000;

type ReservationRange = {
  startTime: Date | string;
  endTime: Date | string;
};

export type DailyReservationSlot = {
  date: string;
  start: Date;
  end: Date;
};

export const formatLocalDateYmd = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

export const getDailyReservationSlots = ({ startTime, endTime }: ReservationRange): DailyReservationSlot[] => {
  const start = toDate(startTime);
  const end = toDate(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return [];
  }

  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  const slots: DailyReservationSlot[] = [];

  while (current <= last) {
    const slotStart = new Date(current);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = new Date(current);
    slotEnd.setHours(endHour, endMinute, 0, 0);

    if (slotEnd > slotStart) {
      slots.push({
        date: formatLocalDateYmd(current),
        start: slotStart,
        end: slotEnd,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
};

export const rangesConflictByDailySlots = (
  left: ReservationRange,
  right: ReservationRange,
  bufferMs = RESERVATION_BUFFER_MS,
) => {
  const leftSlots = getDailyReservationSlots(left);
  const rightSlots = getDailyReservationSlots(right);

  return leftSlots.some((leftSlot) =>
    rightSlots.some((rightSlot) => {
      if (leftSlot.date !== rightSlot.date) {
        return false;
      }

      return (
        leftSlot.start.getTime() < rightSlot.end.getTime() + bufferMs &&
        leftSlot.end.getTime() > rightSlot.start.getTime() - bufferMs
      );
    }),
  );
};

export const isDateInsideDailyReservationSlot = (range: ReservationRange, now = new Date()) =>
  getDailyReservationSlots(range).some(
    (slot) => now.getTime() >= slot.start.getTime() && now.getTime() < slot.end.getTime(),
  );
