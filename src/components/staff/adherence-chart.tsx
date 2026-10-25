"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DayPoint = { date: string; taken: number; skipped: number; missed: number; scheduled: number; rate: number | null };

const COLORS = { taken: "#276a45", skipped: "#8a5a0b", missed: "#a8392a" };

export function AdherenceChart({ series }: { series: DayPoint[] }) {
  return (
    <div>
      <div role="img" aria-label="Stacked bar chart of patient-reported doses per day: taken, skipped and missed. The same data is in the table below." className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="#e4dfd5" />
            <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="taken" name="Taken" stackId="a" fill={COLORS.taken} isAnimationActive={false} />
            <Bar dataKey="skipped" name="Skipped" stackId="a" fill={COLORS.skipped} isAnimationActive={false} />
            <Bar dataKey="missed" name="Missed (not reported)" stackId="a" fill={COLORS.missed} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">View as table</summary>
        <div className="mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-96 text-left text-sm tabular-nums">
            <caption className="sr-only">Patient-reported doses per day</caption>
            <thead className="text-muted">
              <tr><th className="py-1.5 pr-3 font-medium">Date</th><th className="pr-3 font-medium">Taken</th><th className="pr-3 font-medium">Skipped</th><th className="pr-3 font-medium">Missed</th><th className="font-medium">Rate</th></tr>
            </thead>
            <tbody>
              {series.map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1.5 pr-3">{d.date}</td><td className="pr-3">{d.taken}</td><td className="pr-3">{d.skipped}</td><td className="pr-3">{d.missed}</td><td>{d.rate === null ? "n/a" : `${d.rate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
