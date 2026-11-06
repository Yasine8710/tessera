import { CalendarClock, Check, Droplets, Pill } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui/card";

/** Static synthetic data. Built from the real UI primitives so it matches the product. */
const DOSES = [
  { name: "Sample medication A", detail: "1 tablet with breakfast", time: "08:00", state: "Taken", tone: "ok" },
  { name: "Sample medication B", detail: "1 capsule", time: "13:00", state: "Due", tone: "warn" },
  { name: "Sample medication A", detail: "1 tablet with dinner", time: "19:00", state: "Upcoming", tone: "neutral" },
] as const;

const WEEK = [
  { d: "Mon", v: 100 },
  { d: "Tue", v: 100 },
  { d: "Wed", v: 67 },
  { d: "Thu", v: 100 },
  { d: "Fri", v: 100 },
  { d: "Sat", v: 33 },
  { d: "Sun", v: 100 },
];

export function ProductPreview() {
  return (
    <figure aria-label="Illustrative preview of the Tessera interface" className="relative">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="sm:col-span-2">
          <CardHeader title="Today" description="Sample Patient · patient view" action={<Badge tone="accent">Your entries</Badge>} />
          <ul className="divide-y divide-line">
            {DOSES.map((d, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                  <Pill className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.detail}</span>
                </span>
                <span className="text-sm tabular-nums text-ink2">{d.time}</span>
                <Badge tone={d.tone}>{d.state === "Taken" && <Check className="mr-1 size-3" aria-hidden />}{d.state}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Routines" />
          <ul className="space-y-2.5 px-5 py-4 text-sm">
            <li className="flex items-center gap-2.5">
              <Droplets className="size-4 text-info" aria-hidden />
              <span className="flex-1">Hydration check-in</span>
              <Badge tone="ok">Done</Badge>
            </li>
            <li className="flex items-center gap-2.5">
              <CalendarClock className="size-4 text-info" aria-hidden />
              <span className="flex-1">Evening walk</span>
              <Badge>18:30</Badge>
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="Care team view" description="Self-reported adherence, 7 days" />
          <div className="px-5 py-4">
            <div className="flex h-20 items-end gap-1.5" role="img" aria-label="Sample seven day adherence: 100, 100, 67, 100, 100, 33, 100 percent">
              {WEEK.map((w) => (
                <div key={w.d} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-accent" style={{ height: `${Math.max(w.v * 0.6, 6)}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1.5 text-center text-[0.65rem] text-muted" aria-hidden>
              {WEEK.map((w) => (
                <span key={w.d} className="flex-1">
                  {w.d}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <figcaption className="mt-3 text-xs text-muted">Illustrative preview — synthetic data. Shows the type of information the app displays, not a real person.</figcaption>
    </figure>
  );
}
