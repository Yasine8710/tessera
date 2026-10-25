"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { addMeasurementAction } from "@/app/actions/patient";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { measurementSchema } from "@/lib/schemas";
import { localInputToIso, toLocalInput } from "./format";

export type MeasurementType = "BLOOD_PRESSURE" | "WEIGHT" | "GLUCOSE" | "HEART_RATE" | "TEMPERATURE";
export type Limits = Record<MeasurementType, { unit: string; min: number; max: number; min2?: number; max2?: number }>;

export const MEASUREMENT_LABEL: Record<MeasurementType, string> = {
  BLOOD_PRESSURE: "Blood pressure",
  WEIGHT: "Weight",
  GLUCOSE: "Blood glucose",
  HEART_RATE: "Heart rate",
  TEMPERATURE: "Temperature",
};

// Mirrors validateMeasurement() in the domain rules, which cannot be bundled for the browser.
function check(l: Limits[MeasurementType], type: MeasurementType, v: number, v2: number | undefined): string | null {
  if (!Number.isFinite(v) || v < l.min || v > l.max) return `${type === "BLOOD_PRESSURE" ? "Systolic" : "Value"} must be between ${l.min} and ${l.max} ${l.unit}.`;
  if (type === "BLOOD_PRESSURE") {
    if (v2 == null || !Number.isFinite(v2) || v2 < l.min2! || v2 > l.max2!) return `Diastolic must be between ${l.min2} and ${l.max2} ${l.unit}.`;
    if (v2 >= v) return "Systolic must be higher than diastolic.";
  }
  return null;
}

export function MeasurementForm({ limits, tz, nowIso }: { limits: Limits; tz: string; nowIso: string }) {
  const { run, pending, error } = useAction();
  const [type, setType] = useState<MeasurementType>("BLOOD_PRESSURE");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [when, setWhen] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const l = limits[type];
  const bp = type === "BLOOD_PRESSURE";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim() === "" ? NaN : Number(value);
    const v2 = bp ? (value2.trim() === "" ? NaN : Number(value2)) : undefined;
    if (Number.isNaN(v)) return setFieldError(bp ? "Enter the systolic (top) number." : "Enter a value.");
    const msg = check(l, type, v, v2 !== undefined && Number.isNaN(v2) ? undefined : v2);
    if (msg) return setFieldError(msg);
    const recordedAt = when ? localInputToIso(when, tz) : undefined;
    if (when && !recordedAt) return setFieldError("Enter a valid date and time.");
    if (recordedAt && new Date(recordedAt).getTime() > Date.now() + 5 * 60_000) return setFieldError("Measurement time cannot be in the future.");
    const parsed = measurementSchema.safeParse({ type, value: v, value2: bp ? v2 : undefined, recordedAt });
    if (!parsed.success) return setFieldError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
    setFieldError(undefined);
    if (await run(() => addMeasurementAction(parsed.data), "Measurement saved")) {
      setValue("");
      setValue2("");
      setWhen("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-4">
      <p className="text-sm text-muted">Record a reading you took yourself. It is saved as self-reported and has not been checked by a professional.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What did you measure?">
          {(p) => (
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value as MeasurementType);
                setValue("");
                setValue2("");
                setFieldError(undefined);
              }}
              {...p}
            >
              {(Object.keys(MEASUREMENT_LABEL) as MeasurementType[]).map((t) => (
                <option key={t} value={t}>
                  {MEASUREMENT_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-end gap-2">
          <Field label={bp ? "Systolic (top)" : `Value (${l.unit})`} className="flex-1" hint={`Between ${l.min} and ${l.max}`}>
            {(p) => <Input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => setValue(e.target.value)} {...p} />}
          </Field>
          {bp && (
            <Field label="Diastolic (bottom)" className="flex-1" hint={`Between ${l.min2} and ${l.max2}`}>
              {(p) => <Input type="number" inputMode="decimal" step="any" value={value2} onChange={(e) => setValue2(e.target.value)} {...p} />}
            </Field>
          )}
          <span className="pb-2.5 text-sm text-muted" aria-hidden>
            {l.unit}
          </span>
        </div>
      </div>
      <Field label="Date and time (optional)" hint="Leave empty to use now." className="max-w-sm">
        {(p) => <Input type="datetime-local" value={when} max={toLocalInput(new Date(nowIso), tz)} onChange={(e) => setWhen(e.target.value)} {...p} />}
      </Field>
      {(fieldError || error) && (
        <p role="alert" className="text-sm text-danger">
          {fieldError ?? error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        <Plus className="size-4" aria-hidden /> Save measurement
      </Button>
    </form>
  );
}
