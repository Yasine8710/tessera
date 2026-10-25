"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { addJournalAction } from "@/app/actions/patient";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { journalSchema } from "@/lib/schemas";
import { localInputToIso, toLocalInput } from "./format";

const WELLBEING = ["Very low", "Low", "Okay", "Good", "Very good"];

export function JournalForm({ tz, nowIso }: { tz: string; nowIso: string }) {
  const { run, pending, error } = useAction();
  const [wellbeing, setWellbeing] = useState("");
  const [pain, setPain] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [text, setText] = useState("");
  const [shared, setShared] = useState(true);
  const [when, setWhen] = useState("");
  const [fieldError, setFieldError] = useState<string>();

  function addSymptom() {
    const v = draft.trim().slice(0, 60);
    if (v && !symptoms.some((s) => s.toLowerCase() === v.toLowerCase()) && symptoms.length < 15) setSymptoms([...symptoms, v]);
    setDraft("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const pending_ = draft.trim();
    const list = pending_ && !symptoms.includes(pending_) ? [...symptoms, pending_.slice(0, 60)] : symptoms;
    const recordedAt = when ? localInputToIso(when, tz) : undefined;
    if (when && !recordedAt) return setFieldError("Enter a valid date and time.");
    const payload = {
      wellbeing: wellbeing ? Number(wellbeing) : undefined,
      painScore: pain ? Number(pain) : undefined,
      symptoms: list,
      text: text.trim(),
      sharedWithTeam: shared,
      recordedAt,
    };
    const parsed = journalSchema.safeParse(payload);
    if (!parsed.success) return setFieldError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
    if (payload.wellbeing == null && payload.painScore == null && !list.length && !payload.text) return setFieldError("Add at least one detail.");
    if (recordedAt && new Date(recordedAt).getTime() > Date.now() + 5 * 60_000) return setFieldError("Entry time cannot be in the future.");
    setFieldError(undefined);
    const ok = await run(() => addJournalAction(parsed.data), shared ? "Entry saved and shared with your care team" : "Entry saved (private)");
    if (ok) {
      setWellbeing("");
      setPain("");
      setSymptoms([]);
      setDraft("");
      setText("");
      setWhen("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-4">
      <p className="text-sm text-muted">Write what you notice, in your own words. Entries are self-reported notes, not a diagnosis.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="How are you feeling overall?">
          {(p) => (
            <Select value={wellbeing} onChange={(e) => setWellbeing(e.target.value)} {...p}>
              <option value="">Not recorded</option>
              {WELLBEING.map((l, i) => (
                <option key={l} value={i + 1}>
                  {i + 1} - {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Pain level" hint="0 is no pain, 10 is the worst you can imagine.">
          {(p) => (
            <Select value={pain} onChange={(e) => setPain(e.target.value)} {...p}>
              <option value="">Not recorded</option>
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Symptoms you noticed" hint="Type one and press Enter or Add. Up to 15.">
        {(p) => (
          <div>
            <div className="flex gap-2">
              <Input
                value={draft}
                maxLength={60}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSymptom();
                  }
                }}
                {...p}
              />
              <Button type="button" variant="secondary" onClick={addSymptom} disabled={!draft.trim()}>
                Add
              </Button>
            </div>
            {symptoms.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Symptoms added">
                {symptoms.map((s) => (
                  <li key={s} className="inline-flex items-center gap-1 rounded-sm bg-surface2 py-0.5 pl-2 pr-1 text-sm">
                    {s}
                    <button type="button" aria-label={`Remove ${s}`} onClick={() => setSymptoms(symptoms.filter((x) => x !== s))} className="rounded p-0.5 hover:bg-line">
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Field>

      <Field label="Notes" hint="Optional. Up to 2000 characters.">
        {(p) => <Textarea maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} {...p} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date and time (optional)" hint="Leave empty to use now.">
          {(p) => <Input type="datetime-local" value={when} max={toLocalInput(new Date(nowIso), tz)} onChange={(e) => setWhen(e.target.value)} {...p} />}
        </Field>
        <div className="self-end">
          <Checkbox
            label="Share with my care team"
            hint="Only connected professionals you allowed to see journal entries can read shared entries."
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
        </div>
      </div>

      {(fieldError || error) && (
        <p role="alert" className="text-sm text-danger">
          {fieldError ?? error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        <Plus className="size-4" aria-hidden /> Save entry
      </Button>
    </form>
  );
}
