"use client";

import { useId, useRef } from "react";
import { Button } from "./button";

/** Destructive-action guard using the native <dialog> (focus trap + Esc handled by the browser). */
export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "danger",
  size = "sm",
  disabled,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "secondary";
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <Button type="button" variant={variant === "danger" ? "secondary" : variant} size={size} disabled={disabled} className={variant === "danger" ? "text-danger" : ""} onClick={() => ref.current?.showModal()}>
        {label}
      </Button>
      <dialog ref={ref} aria-labelledby={titleId}>
        <div className="p-7">
          <span aria-hidden className="anim-grow-x mb-4 block h-px w-10 bg-danger" />
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-2.5 text-ink2">{message}</p>
          <div className="mt-8 flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                ref.current?.close();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
