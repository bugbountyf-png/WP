import { isoDate, startOfUtcDay } from "./utils";

export type CalendarKind = "wedding" | "task" | "pay" | "note";

export type CalendarEvent = {
  key: string;
  date: string;
  title: string;
  detail: string;
  kind: CalendarKind;
  reminderId?: string;
};

export function collectCalendarEvents(input: {
  partnerAName: string;
  partnerBName: string;
  weddingDate: Date;
  tasks: Array<{ id: string; title: string; dueDate: Date | null }>;
  payments: Array<{ id: string; title: string; dueDate: Date }>;
  reminders: Array<{ id: string; title: string; date: Date; notes: string | null }>;
}): CalendarEvent[] {
  const events: CalendarEvent[] = [
    {
      key: "wedding",
      date: isoDate(input.weddingDate),
      title: "Hari pernikahan",
      detail: `${input.partnerAName} & ${input.partnerBName}`,
      kind: "wedding",
    },
    ...input.tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        key: `task-${task.id}`,
        date: isoDate(task.dueDate!),
        title: task.title,
        detail: "Checklist",
        kind: "task" as const,
      })),
    ...input.payments.map((payment) => ({
      key: `pay-${payment.id}`,
      date: isoDate(payment.dueDate),
      title: payment.title,
      detail: "Pembayaran",
      kind: "pay" as const,
    })),
    ...input.reminders.map((reminder) => ({
      key: `note-${reminder.id}`,
      date: isoDate(reminder.date),
      title: reminder.title,
      detail: reminder.notes ?? "Pengingat",
      kind: "note" as const,
      reminderId: reminder.id,
    })),
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function toIcs(events: CalendarEvent[], calendarName: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Buma//Wedding Planner//ID",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
  ];
  for (const event of events) {
    const day = event.date.replace(/-/g, "");
    const end = isoDate(new Date(startOfUtcDay(event.date).getTime() + 86_400_000)).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.key}@buma.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(event.detail)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
