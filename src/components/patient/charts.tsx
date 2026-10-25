"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { fontSize: 12, fill: "#62747a" } as const;
const GRID = "#e4dfd5";

export type AdherencePoint = { label: string; taken: number; skipped: number; missed: number };

/** Daily dose reports. Always render a table alongside (see ChartTable). */
export function AdherenceChart({ data, summary }: { data: AdherencePoint[]; summary: string }) {
  return (
    <div role="img" aria-label={summary} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={AXIS} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(15,42,51,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="taken" name="Taken" stackId="d" fill="#0d7673" isAnimationActive={false} />
          <Bar dataKey="skipped" name="Skipped" stackId="d" fill="#9fb0b5" isAnimationActive={false} />
          <Bar dataKey="missed" name="Missed" stackId="d" fill="#b9791a" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type LineSeries = { key: string; name: string; color: string };

export function TrendChart({
  data,
  series,
  summary,
  unit,
  domain,
}: {
  data: Record<string, number | string | null>[];
  series: LineSeries[];
  summary: string;
  unit?: string;
  domain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
}) {
  return (
    <div role="img" aria-label={summary} className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} domain={domain ?? ["auto", "auto"]} unit={unit} width={unit ? 52 : 40} />
          <Tooltip />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
