export function formatDateIdShort(dateInput: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
        year: "numeric",
  }).format(new Date(dateInput));
}

export function formatTimeIdShort(dateInput: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}
