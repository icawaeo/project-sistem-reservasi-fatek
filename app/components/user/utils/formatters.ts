export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatTimeRange = (start: string, end: string) => {
  const startLabel = new Date(start).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endLabel = new Date(end).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${startLabel} - ${endLabel} WITA`;
};

export const formatDateRange = (start: string, end: string) => {
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  if (startDate === endDate) return startDate;
  return `${startDate} - ${endDate}`;
};
