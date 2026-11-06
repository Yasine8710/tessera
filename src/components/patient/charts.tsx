"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** All colours are CSS variables so charts follow the light/dark theme. */
const AXIS = { fontSize: 12, fill: "var(--c-muted)" } as const;
const GRID = "var(--c-border)";
const TOOLTIP = {
  contentStyle: { background: "var(--c-surface)", border: "1px solid var(--c-border-strong)", borderRadius: "var(--r-md)", color: "var(--c-ink)", fontSize: 13, boxShadow: "var(--shadow-sm)" },
  labelStyle: { color: "var(--c-ink)", fontWeight: 600 },
  itemStyle: { color: "var(--c-ink-2)" },
} as const;
const LEGEND = { fontSize: 12, color: "var(--c-ink-2)" } as const;

export type AdherencePoint = { label: string; taken: number; skipped: number; missed: number };

/** Daily dose reports. Always render a table alongside (see ChartTable). */
export function AdherenceChart({ data, summary }: { data: AdherencePoint[]; summary: string }) {
  return (
    <div role="img" aria-label={summary} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: "var(--c-surface-2)", opacity: 0.7 }} />
          <Legend wrapperStyle={LEGEND} />
          <Bar dataKey="taken" name="Taken" stackId="d" fill="var(--c-accent)" animationDuration={800} animationEasing="ease-out" />
          <Bar dataKey="skipped" name="Skipped" stackId="d" fill="var(--c-muted)" animationDuration={800} animationBegin={150} animationEasing="ease-out" />
          <Bar dataKey="missed" name="Missed" stackId="d" fill="var(--c-warn)" animationDuration={800} animationBegin={300} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** `color` is a CSS colour: use a var(--c-*) token, never a literal. */
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
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={domain ?? ["auto", "auto"]} unit={unit} width={unit ? 52 : 40} />
          <Tooltip {...TOOLTIP} cursor={{ stroke: "var(--c-border-strong)" }} />
          {series.length > 1 && <Legend wrapperStyle={LEGEND} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--c-surface)", stroke: s.color, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: s.color, stroke: "var(--c-surface)" }}
              connectNulls
              animationDuration={900}
              animationBegin={i * 150}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
