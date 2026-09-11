import Link from "next/link";
import { requireWedding, getWeddingDashboard } from "@/lib/session";
import { budgetHealth, budgetTotals, monthsBetween } from "@/lib/budget";
import { daysUntil, formatLongDate, formatRupiahCompact, todayInApp } from "@/lib/utils";
import { guestSeats } from "@/lib/guests";
import { TASK_CATEGORY_LABELS } from "@/lib/labels";
import { PageHeader, Stat } from "@/components/chrome";

export default async function DashboardPage() {
  const { wedding } = await requireWedding();
  const data = await getWeddingDashboard(wedding.id);
  const remaining = daysUntil(data.weddingDate);
  const { allocated, paid, saved: savingsTotal } = budgetTotals({
    items: data.budgetItems,
    payments: data.payments,
    savings: data.savings,
    vendors: data.vendors,
    seserahan: data.seserahanItems,
  });
  const health = budgetHealth({
    totalBudget: data.totalBudget,
    totalEstimated: allocated,
    totalPaid: paid,
    currentSavings: savingsTotal,
    expenseCount: data.budgetItems.length + data.payments.length,
    monthsRemaining: monthsBetween(todayInApp(), data.weddingDate),
  });
  const completed = data.tasks.filter((t) => t.completed).length;
  const openTasks = data.tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
    .slice(0, 5);
  const confirmedPax = data.guests.reduce((s, g) => s + guestSeats(g, "confirmed"), 0);
  const bookedVendors = data.vendors.filter((v) => v.status === "BOOKED" || v.status === "PAID").length;

  const categories = Object.entries(
    data.tasks.reduce<Record<string, { total: number; done: number }>>((acc, task) => {
      acc[task.category] ??= { total: 0, done: 0 };
      acc[task.category].total += 1;
      if (task.completed) acc[task.category].done += 1;
      return acc;
    }, {}),
  )
    .map(([category, value]) => ({ category, ...value, remaining: value.total - value.done }))
    .filter((row) => row.remaining > 0)
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        kicker={`${data.location} · ${data.weddingType === "PRIVATE" ? "Tertutup" : "Terbuka"}`}
        title={`${remaining} hari lagi`}
        description={`${data.partnerAName} & ${data.partnerBName} · ${formatLongDate(data.weddingDate)}`}
      />

      <div className="gutter grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Checklist" value={`${completed}/${data.tasks.length}`} hint={data.tasks.length ? `${Math.round((completed / data.tasks.length) * 100)}% selesai` : "Belum ada tugas"} />
        <Stat label="Budget" value={formatRupiahCompact(data.totalBudget)} hint={`${health.label} · skor ${health.score}`} />
        <Stat label="Tabungan" value={formatRupiahCompact(savingsTotal)} hint={data.totalBudget ? `butuh ${formatRupiahCompact(Math.max(0, data.totalBudget - savingsTotal))} lagi` : undefined} />
        <Stat label="Tamu" value={`${confirmedPax} hadir`} hint={`${data.guests.length} nama · ${bookedVendors} vendor locked`} />
      </div>

      <p className="gutter mt-4 text-sm text-muted-foreground">{health.hint}</p>

      <section className="gutter mt-10 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="font-medium">Agenda terdekat</h2>
          {openTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Tidak ada tugas terbuka. Isi checklist atau tandai yang sudah selesai.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {TASK_CATEGORY_LABELS[task.category as keyof typeof TASK_CATEGORY_LABELS] ?? task.category}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.dueDate ? formatLongDate(task.dueDate) : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/app/calendar" className="mt-4 inline-block text-sm text-primary">
            Buka kalender
          </Link>
        </div>
        <div className="surface p-5">
          <h2 className="font-medium">Yang masih terbuka</h2>
          <ul className="mt-4 grid gap-2">
            {categories.map((row) => (
              <li key={row.category} className="flex justify-between text-sm">
                <span>{TASK_CATEGORY_LABELS[row.category as keyof typeof TASK_CATEGORY_LABELS] ?? row.category}</span>
                <span className="text-muted-foreground">{row.remaining} tugas</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
