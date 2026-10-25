"use client";

import { useEffect, useId, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, Input } from "@/components/ui/form";

/**
 * Text input with a datalist of IANA zones. The value defaults to the browser's zone
 * once mounted (`onDetect` writes it into the form; no option list is needed first).
 */
export function TimezoneField({
  registration,
  onDetect,
  error,
}: {
  registration: UseFormRegisterReturn<"timezone">;
  onDetect: (tz: string) => void;
  error?: string;
}) {
  const listId = useId();
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    let tz = "UTC";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
      if (list) setZones(list);
    } catch {
      // keep UTC
    }
    onDetect(tz);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Field label="Time zone" hint="Detected from your device. Reminders and appointment times are shown in this zone." error={error}>
      {(a) => (
        <>
          <Input list={listId} autoComplete="off" {...a} {...registration} />
          <datalist id={listId}>
            {zones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </>
      )}
    </Field>
  );
}
