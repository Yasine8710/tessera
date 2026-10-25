"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-line2 bg-surface px-3 text-[0.95rem] text-ink placeholder:text-muted/80 transition-colors focus:border-accent disabled:bg-surface2 aria-[invalid=true]:border-danger";

export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(control, "h-10", className)} {...p} />
);
export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(control, "min-h-24 py-2", className)} {...p} />
);
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(control, "h-10 pr-8", className)} {...p} />
);

/** Label + control + hint + error, wired with ids for assistive tech. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (a: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const desc = error ? `${id}-e` : hint ? `${id}-h` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-describedby": desc, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-e`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-h`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, hint, className, ...p }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input id={id} type="checkbox" className="mt-1 size-4 accent-[var(--c-accent)]" {...p} />
      <label htmlFor={id} className="text-sm leading-snug">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-muted">{hint}</span>}
      </label>
    </div>
  );
}
