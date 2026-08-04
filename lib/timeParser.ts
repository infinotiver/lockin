export const formatDuration = (ms: number): string => {
  if (!ms) return "0m";

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return null;

  const value = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? `${isoDate}T00:00:00`
    : isoDate;

  const d = new Date(value);

  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
};

/** Formats a deadline in the device's local time zone so users see its exact cutoff. */
export const formatDateTime = (isoDate?: string | null) => {
  if (!isoDate) return null;

  const value = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? `${isoDate}T00:00:00`
    : isoDate;
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};
