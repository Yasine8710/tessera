type Med = { name: string; dose: string; route?: string | null; instructions?: string | null; timesOfDay: string[]; daysOfWeek: number[]; status: string };
export type Snap = { title: string; instructions: string; startDate: string; endDate: string | null; medications: Med[] };

/** Defensive parse: version snapshots are stored JSON. */
export function asSnap(v: unknown): Snap | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Partial<Snap>;
  if (typeof o.title !== "string") return null;
  return {
    title: o.title,
    instructions: typeof o.instructions === "string" ? o.instructions : "",
    startDate: String(o.startDate ?? ""),
    endDate: o.endDate ? String(o.endDate) : null,
    medications: Array.isArray(o.medications) ? o.medications : [],
  };
}

const medLine = (m: Med) => `${m.name} ${m.dose}${m.timesOfDay.length ? ` at ${m.timesOfDay.join(", ")}` : ""}`;

/** Plain-language list of what changed between two stored versions. */
export function summarizeDiff(prev: Snap | null, cur: Snap | null): string[] {
  if (!cur) return [];
  if (!prev) return [`Plan created: "${cur.title}"`, ...cur.medications.map((m) => `Medication: ${medLine(m)}`)];
  const out: string[] = [];
  if (prev.title !== cur.title) out.push(`Title: "${prev.title}" to "${cur.title}"`);
  if (prev.instructions !== cur.instructions) out.push("Instructions were edited");
  if (prev.startDate !== cur.startDate) out.push(`Start date: ${prev.startDate} to ${cur.startDate}`);
  if (prev.endDate !== cur.endDate) out.push(`End date: ${prev.endDate ?? "none"} to ${cur.endDate ?? "none"}`);
  const before = new Map(prev.medications.map((m) => [m.name, m]));
  for (const m of cur.medications) {
    const b = before.get(m.name);
    if (!b) out.push(`Medication added: ${medLine(m)}`);
    else if (b.status !== m.status) out.push(`Medication ${m.status === "ENDED" ? "stopped" : "restarted"}: ${m.name}`);
    else if (b.dose !== m.dose || b.timesOfDay.join() !== m.timesOfDay.join()) out.push(`Medication changed: ${medLine(m)}`);
  }
  return out;
}
