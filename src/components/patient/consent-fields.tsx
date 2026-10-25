"use client";

import { Checkbox } from "@/components/ui/form";

export type ConsentKey = "JOURNAL" | "MEASUREMENTS" | "ROUTINES" | "MEDICATION_ADHERENCE";

export const CONSENT_COPY: Record<ConsentKey, { label: string; hint: string }> = {
  JOURNAL: { label: "Journal entries", hint: "Only entries you mark as shared." },
  MEASUREMENTS: { label: "Measurements", hint: "Readings such as blood pressure or weight." },
  ROUTINES: { label: "Routines", hint: "Which routines you completed." },
  MEDICATION_ADHERENCE: { label: "Medication reports", hint: "Whether you reported doses as taken or skipped." },
};
export const CONSENT_KEYS = Object.keys(CONSENT_COPY) as ConsentKey[];

export type ConsentState = Record<ConsentKey, boolean>;
export const NO_CONSENTS: ConsentState = { JOURNAL: false, MEASUREMENTS: false, ROUTINES: false, MEDICATION_ADHERENCE: false };

/** Sharing choices; nothing is selected by default. */
export function ConsentFields({ value, onChange, disabled }: { value: ConsentState; onChange: (v: ConsentState) => void; disabled?: boolean }) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">What may this professional see?</legend>
      {CONSENT_KEYS.map((k) => (
        <Checkbox key={k} label={CONSENT_COPY[k].label} hint={CONSENT_COPY[k].hint} checked={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.checked })} />
      ))}
      <p className="text-sm text-muted">You can change these at any time. Your care plan and appointments with this professional are always visible to them.</p>
    </fieldset>
  );
}
