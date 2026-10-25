/** Date formatting in the viewer's timezone. Falls back to UTC if the zone is invalid. */
function fmt(d: Date | string, tz: string, opts: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("en", { timeZone: tz, ...opts }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", { timeZone: "UTC", ...opts }).format(date);
  }
}

export const formatDateTime = (d: Date | string, tz: string) =>
  fmt(d, tz, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatTime = (d: Date | string, tz: string) => fmt(d, tz, { hour: "2-digit", minute: "2-digit" });

export const formatDay = (d: Date | string, tz: string) => fmt(d, tz, { weekday: "short", day: "numeric", month: "short" });

/** Calendar-day key in the viewer's timezone, for grouping. */
export const dayKey = (d: Date | string, tz: string) => fmt(d, tz, { year: "numeric", month: "2-digit", day: "2-digit" });
