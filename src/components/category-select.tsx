"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { createBudgetCategory, deleteBudgetCategory } from "@/app/actions/data";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export function CategorySelect({
  categories,
  name,
  defaultValue,
  manage = false,
}: {
  categories: Category[];
  name: string;
  defaultValue?: string | null;
  manage?: boolean;
}) {
  const initial =
    categories.find((row) => row.id === defaultValue)?.id ??
    categories.find((row) => row.name.trim().toLowerCase() === "lainnya")?.id ??
    categories[0]?.id ??
    "";
  const [rows, setRows] = useState(categories);
  const [current, setCurrent] = useState(initial);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setRows((currentRows) => {
      const ids = new Set(categories.map((row) => row.id));
      const extra = currentRows.filter((row) => !ids.has(row.id));
      return [...categories, ...extra];
    });
  }, [categories]);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open, rows.length]);

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

  const selected = rows.find((row) => row.id === current) ?? rows[0];

  async function addCategory() {
    const nameValue = draft.trim();
    if (!nameValue || pending) return;
    setPending(true);
    const result = await createBudgetCategory(nameValue);
    setPending(false);
    if (result.error || !result.category) {
      setError(result.error ?? "Kategori belum tersimpan.");
      return;
    }
    setRows((currentRows) => [...currentRows, result.category!]);
    setCurrent(result.category.id);
    setDraft("");
    setError("");
    setOpen(false);
  }

  async function removeCategory(id: string) {
    if (pending) return;
    setPending(true);
    const result = await deleteBudgetCategory(id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
    if (current === id) {
      const next = rows.find((row) => row.id !== id);
      setCurrent(next?.id ?? "");
    }
    setError("");
  }

  return (
    <div ref={wrapRef} className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-base text-foreground outline-none transition md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="truncate">{selected?.name || "Pilih"}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open
        ? createPortal(
            <div
              id={listId}
              style={{ top: box.top, left: box.left, width: box.width }}
              className="fixed z-[80] flex max-h-72 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-xl"
            >
              <ul role="listbox" className="min-h-0 flex-1 overflow-auto py-1">
                {rows.map((row) => {
                  const active = row.id === selected?.id;
                  return (
                    <li key={row.id} className="flex items-center">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn("min-w-0 flex-1 px-3 py-2 text-left text-sm", active ? "bg-accent font-medium" : "hover:bg-muted")}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setCurrent(row.id);
                          setOpen(false);
                        }}
                      >
                        <span className="block truncate">{row.name}</span>
                      </button>
                      {manage ? (
                        <button
                          type="button"
                          className="shrink-0 px-3 py-2 text-xs text-muted-foreground"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void removeCategory(row.id)}
                        >
                          Hapus
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {manage ? (
                <div className="flex items-center gap-2 border-t border-border p-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addCategory();
                      }
                    }}
                    placeholder="Kategori baru"
                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:border-ring"
                  />
                  <button type="button" className="shrink-0 text-sm text-primary" onClick={() => void addCategory()}>
                    Tambah
                  </button>
                </div>
              ) : null}
              {error ? <p className="px-3 pb-2 text-xs text-muted-foreground">{error}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
