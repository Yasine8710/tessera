"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Button that opens a native <dialog> (focus trap + Esc by the browser) holding a small form. */
export function FormDialog({
  label,
  title,
  description,
  variant = "secondary",
  size = "sm",
  children,
}: {
  label: string;
  title: string;
  description?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  children: (close: () => void) => React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const close = () => ref.current?.close();
  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => ref.current?.showModal()}>
        {label}
      </Button>
      <dialog ref={ref} aria-labelledby={id}>
        <div className="p-6">
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          <div className="mt-4">{children(close)}</div>
        </div>
      </dialog>
    </>
  );
}
