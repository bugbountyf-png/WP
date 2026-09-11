"use client";

import { useMemo, useState } from "react";
import { createReminder, deleteReminder } from "@/app/actions/data";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { WEEKDAY_SHORT } from "@/lib/labels";
import type { CalendarEvent } from "@/lib/calendar";
import { addUtcMonths, daysUntil, formatAgendaHeading, formatMonthYear, isoDate, startOfUtcDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

const KIND_DOT: Record<CalendarEvent["kind"], string> = {
  wedding: "bg-primary",
  task: "bg-tone-fern",
  pay: "bg-tone-marigold",
  note: "bg-tone-lagoon",
};

function monthCells(cursor: Date) {
  const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
  const startWeekday = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), -i)), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), day)), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getTime() + 86_400_000), inMonth: false });
  }
  return cells;
}

export function CalendarBoard({ events }: { events: CalendarEvent[] }) {
  const today = startOfUtcDay(new Date());
  const [cursor, setCursor] = useState(() => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  const [selected, setSelected] = useState(isoDate(today));
  const [open, setOpen] = useState(false);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);
  const cells = monthCells(cursor);
  const dayEvents = byDate.get(selected) ?? [];
  const upcoming = events.filter((event) => event.date > selected).slice(0, 6);

  return (
    <div className="gutter grid gap-8 pb-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <a
            href="/app/calendar/export"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium"
          >
            Export
          </a>
          <Button onClick={() => setOpen(true)}>+ Tambah pengingat</Button>
        </div>
        <div className="surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-xl capitalize">{formatMonthYear(cursor)}</h2>
            <div className="flex gap-1">
              <button className="size-8 rounded-full text-muted-foreground hover:bg-muted" onClick={() => setCursor((d) => addUtcMonths(d, -1))} aria-label="Bulan sebelumnya">
                ‹
              </button>
              <button className="size-8 rounded-full text-muted-foreground hover:bg-muted" onClick={() => setCursor((d) => addUtcMonths(d, 1))} aria-label="Bulan berikutnya">
                ›
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[0.65rem] font-medium tracking-wide text-muted-foreground">
            {WEEKDAY_SHORT.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const key = isoDate(cell.date);
              const isSelected = key === selected;
              const isToday = key === isoDate(today);
              const dots = byDate.get(key) ?? [];
              return (
                <button
                  key={key + String(cell.inMonth)}
                  type="button"
                  onClick={() => {
                    setSelected(key);
                    setCursor(new Date(Date.UTC(cell.date.getUTCFullYear(), cell.date.getUTCMonth(), 1)));
                  }}
                  className={cn(
                    "relative grid h-11 place-items-center rounded-full text-sm",
                    !cell.inMonth && "text-muted-foreground/50",
                    isSelected && "bg-primary font-medium text-primary-foreground",
                    !isSelected && isToday && "bg-muted font-medium",
                  )}
                >
                  {cell.date.getUTCDate()}
                  {dots.length > 0 && !isSelected ? (
                    <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {dots.slice(0, 3).map((dot) => (
                        <span key={dot.key} className={cn("size-1 rounded-full", KIND_DOT[dot.kind])} />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <section>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{formatAgendaHeading(selected)}</p>
          {dayEvents.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nggak ada agenda di tanggal ini.</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {dayEvents.map((event) => (
                <li key={event.key} className="surface flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  {event.reminderId ? <ReminderDelete id={event.reminderId} /> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">BERIKUTNYA</p>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Tidak ada agenda setelah tanggal ini.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {upcoming.map((event) => (
                <li key={event.key} className="surface flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className={cn("mr-2 inline-block size-1.5 rounded-full", KIND_DOT[event.kind])} />
                      {event.detail}
                      {" · "}
                      {daysUntil(event.date) > 0 ? `${daysUntil(event.date)} hari lagi` : "Hari ini"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          <button className="absolute inset-0 bg-foreground/30" aria-label="Tutup" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
            <h2 className="display mb-4 text-2xl">Pengingat</h2>
            <form
              action={async (formData) => {
                await createReminder(formData);
                setOpen(false);
              }}
              className="grid gap-4"
            >
              <Field label="Judul">
                <Input name="title" required autoFocus />
              </Field>
              <Field label="Tanggal">
                <Input type="date" name="date" defaultValue={selected} required />
              </Field>
              <Field label="Catatan">
                <Textarea name="notes" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Tambah</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReminderDelete({ id }: { id: string }) {
  return (
    <form action={deleteReminder.bind(null, id)}>
      <button className="text-xs text-muted-foreground hover:text-destructive">Hapus</button>
    </form>
  );
}
