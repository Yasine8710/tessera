/** Formats a date in an explicit IANA time zone; never relies on server-local time. */
export function fmtDate(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(d);
  }
}
