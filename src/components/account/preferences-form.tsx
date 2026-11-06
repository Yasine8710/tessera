"use client";

import { useId, useMemo, useState } from "react";
import { updatePreferencesAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export type Prefs = { doseReminders: boolean; missedAlerts: boolean; routineReminders: boolean; appointmentAlerts: boolean; messageAlerts: boolean };

const ROWS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "doseReminders", label: "Dose reminders", hint: "When a medication dose is due." },
  { key: "missedAlerts", label: "Missed-dose alerts", hint: "When a dose passes without being recorded." },
  { key: "routineReminders", label: "Routine reminders", hint: "For hydration, activity and other routines." },
  { key: "appointmentAlerts", label: "Appointment alerts", hint: "Upcoming and changed appointments." },
  { key: "messageAlerts", label: "Message alerts", hint: "A notice that a new message is waiting. Message text is never included." },
];

function Switch({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="text-sm">
        <span className="block font-medium">{label}</span>
        <span className="block text-muted">{hint}</span>
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line2 transition-colors before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-surface before:shadow-sm before:transition-transform checked:bg-accent checked:before:translate-x-5 motion-reduce:transition-none motion-reduce:before:transition-none"
      />
    </div>
  );
}

export function PreferencesForm({ initial, timezone }: { initial: Prefs; timezone: string }) {
  const [prefs, setPrefs] = useState(initial);
  const [tz, setTz] = useState(timezone);
  const { run, pending, error } = useAction();
  const zones = useMemo(() => {
    const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    return all.includes(timezone) ? all : [timezone, ...all];
  }, [timezone]);
  const dirty = tz !== timezone || ROWS.some((r) => prefs[r.key] !== initial[r.key]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => updatePreferencesAction({ ...prefs, timezone: tz }), "Settings saved");
      }}
      className="space-y-5 px-5 py-5"
    >
      <Field label="Time zone" hint="Dates, times and reminders are shown in this zone.">
        {(a) => (
          <Select value={tz} onChange={(e) => setTz(e.target.value)} {...a}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">In-app notifications</legend>
        <div className="mt-1 divide-y divide-line">
          {ROWS.map((r) => (
            <Switch key={r.key} label={r.label} hint={r.hint} checked={prefs[r.key]} onChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))} />
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={pending} disabled={!dirty}>
        Save changes
      </Button>
    </form>
  );
}
