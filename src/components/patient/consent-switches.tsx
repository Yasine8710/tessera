"use client";

import { updateConsentsAction } from "@/app/actions/care";
import { useAction } from "@/components/ui/use-action";
import { cn } from "@/lib/cn";
import { CONSENT_COPY, CONSENT_KEYS, type ConsentState } from "./consent-fields";

/** Immediate on/off switches: each change is saved and takes effect straight away. */
export function ConsentSwitches({ relationshipId, consents, name }: { relationshipId: string; consents: ConsentState; name: string }) {
  const { run, pending, error } = useAction();
  return (
    <div>
      <ul className="divide-y divide-line rounded-md border border-line">
        {CONSENT_KEYS.map((k) => {
          const on = consents[k];
          return (
            <li key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <p id={`${relationshipId}-${k}`} className="text-sm font-medium">
                  {CONSENT_COPY[k].label}
                </p>
                <p className="text-sm text-muted">{CONSENT_COPY[k].hint}</p>
              </div>
              <label className={cn("relative inline-flex shrink-0 items-center", pending && "opacity-60")}>
                <input
                  type="checkbox"
                  role="switch"
                  className="peer sr-only"
                  checked={on}
                  disabled={pending}
                  aria-labelledby={`${relationshipId}-${k}`}
                  onChange={(e) =>
                    run(() => updateConsentsAction(relationshipId, { [k]: e.target.checked }), e.target.checked ? `Now sharing ${CONSENT_COPY[k].label.toLowerCase()} with ${name}` : `Stopped sharing ${CONSENT_COPY[k].label.toLowerCase()} with ${name}`)
                  }
                />
                <span className="h-6 w-11 rounded-full border border-line2 bg-surface2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" aria-hidden />
                <span className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" aria-hidden />
                <span className="sr-only">{on ? "Shared" : "Not shared"}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
