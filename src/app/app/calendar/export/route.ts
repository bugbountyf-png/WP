import { collectCalendarEvents, toIcs } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";

export async function GET() {
  const { wedding } = await requireWedding();
  const [tasks, payments, reminders] = await Promise.all([
    prisma.task.findMany({ where: { weddingId: wedding.id, dueDate: { not: null }, completed: false } }),
    prisma.payment.findMany({ where: { weddingId: wedding.id, paidDate: null } }),
    prisma.reminder.findMany({ where: { weddingId: wedding.id } }),
  ]);
  const events = collectCalendarEvents({
    partnerAName: wedding.partnerAName,
    partnerBName: wedding.partnerBName,
    weddingDate: wedding.weddingDate,
    tasks,
    payments,
    reminders,
  });
  const ics = toIcs(events, `Pernikahan ${wedding.partnerAName} & ${wedding.partnerBName}`);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="kalender-${wedding.invitationSlug}.ics"`,
    },
  });
}
