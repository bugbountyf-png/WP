"use client";

import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; disabled?: boolean };

function readOptions(children: React.ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: React.ReactNode; disabled?: boolean; label?: string }>(child)) {
      return [];
    }
    const type = child.type;
    const isOption = type === "option" || (typeof type === "string" && type.toLowerCase() === "option");
    const isGroup = type === "optgroup" || (typeof type === "string" && type.toLowerCase() === "optgroup");
    if (isGroup) return readOptions(child.props.children);
    if (!isOption) return readOptions(child.props.children);
    return [
      {
        value: String(child.props.value ?? ""),
        label: String(child.props.children ?? child.props.label ?? ""),
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
}

export function Select({
  className,
  children,
  name,
  defaultValue,
  value,
  onChange,
  required,
  disabled,
  id,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const options = readOptions(children);
  const initial = String(value ?? defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(initial);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (value !== undefined) setCurrent(String(value));
  }, [value]);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        const list = document.getElementById(listId);
        if (list && list.contains(event.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [listId]);

  const selected = options.find((option) => option.value === current) ?? options[0];

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={current} required={required} />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-base text-foreground outline-none transition md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <span className="truncate">{selected?.label || "Pilih"}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              style={{ top: box.top, left: box.left, width: box.width }}
              className="fixed z-[80] max-h-64 overflow-auto rounded-lg border border-border bg-card py-1 text-foreground shadow-xl"
            >
              {options.map((option) => {
                const active = option.value === current;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      className={cn(
                        "flex w-full px-3 py-2 text-left text-sm text-foreground",
                        active ? "bg-accent font-medium" : "hover:bg-muted",
                        option.disabled && "opacity-40",
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setCurrent(option.value);
                        setOpen(false);
                        onChange?.({
                          target: { value: option.value, name: name ?? "" },
                        } as React.ChangeEvent<HTMLSelectElement>);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
