import { CalendarBoard } from "@/components/calendar-board";
import { PageHeader } from "@/components/chrome";
import { collectCalendarEvents } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";

export default async function CalendarPage() {
  const { wedding } = await requireWedding();
  const [tasks, payments, reminders] = await Promise.all([
    prisma.task.findMany({ where: { weddingId: wedding.id, dueDate: { not: null }, completed: false } }),
    prisma.payment.findMany({ where: { weddingId: wedding.id, paidDate: null } }),
    prisma.reminder.findMany({ where: { weddingId: wedding.id }, orderBy: { date: "asc" } }),
  ]);
  const events = collectCalendarEvents({
    partnerAName: wedding.partnerAName,
    partnerBName: wedding.partnerBName,
    weddingDate: wedding.weddingDate,
    tasks,
    payments,
    reminders,
  });

  return (
    <div>
      <PageHeader
        kicker="Kalender"
        title="Kalender"
        description="Jadwal bayar, tenggat checklist, dan pengingat kamu sendiri dalam satu tanggalan."
      />
      <CalendarBoard events={events} />
    </div>
  );
}
