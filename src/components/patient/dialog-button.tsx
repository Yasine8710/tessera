"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Trigger + native <dialog> (focus trap and Esc come from the browser).
 * Body is only mounted while open, so forms reset every time.
 */
export function DialogButton({
  label,
  title,
  variant = "secondary",
  size = "sm",
  icon,
  ariaLabel,
  children,
}: {
  label: string;
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  ariaLabel?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => ref.current?.close();
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
      >
        {icon}
        {label}
      </Button>
      <dialog ref={ref} aria-labelledby={titleId} onClose={() => setOpen(false)}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button type="button" onClick={close} aria-label="Close" className="-m-1.5 rounded-md p-1.5 text-muted hover:bg-surface2">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-3">{open && children(close)}</div>
        </div>
      </dialog>
    </>
  );
}
