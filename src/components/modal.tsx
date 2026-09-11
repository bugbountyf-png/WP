"use client";

import { useState } from "react";
import { Button, rowActionClass } from "./ui";

export function Modal({
  triggerLabel,
  title,
  children,
  variant = "primary",
}: {
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "ghost" ? (
        <button type="button" className={`${rowActionClass} text-primary`} onClick={() => setOpen(true)}>
          {triggerLabel}
        </button>
      ) : (
        <Button variant={variant} onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      )}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          <button className="absolute inset-0 bg-foreground/30" aria-label="Tutup" onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="display text-2xl">{title}</h2>
              <button className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                Tutup
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function FormActions({ pendingLabel = "Menyimpan…" }: { pendingLabel?: string }) {
  return (
    <Button type="submit" className="w-full">
      {pendingLabel.replace("…", "")}
    </Button>
  );
}
