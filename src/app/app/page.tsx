import Link from "next/link";
import { requireWedding, getWeddingDashboard } from "@/lib/session";
import { budgetHealth, budgetTotals, monthsBetween, potLedgers } from "@/lib/budget";
import { ensureSavingsPots } from "@/lib/pots";
import { PotBalances } from "@/components/pot-balances";
import { daysUntil, formatLongDate, formatRupiah, formatRupiahCompact, todayInApp } from "@/lib/utils";
import { guestSeats } from "@/lib/guests";
import { HomeHero } from "@/components/home-hero";
import { TASK_CATEGORY_LABELS } from "@/lib/labels";

export default async function DashboardPage() {
  const { wedding } = await requireWedding();
  const data = await getWeddingDashboard(wedding.id);
  const remaining = daysUntil(data.weddingDate);
  const totalsInput = {
    items: data.budgetItems,
    payments: data.payments,
    savings: data.savings,
    vendors: data.vendors,
    seserahan: data.seserahanItems,
  };
  const { allocated, paid, remainingPay } = budgetTotals(totalsInput);
  const catalog = await ensureSavingsPots(data);
  const pots = potLedgers(totalsInput, catalog);
  const cash = pots.reduce((sum, pot) => sum + pot.balance, 0);
  const health = budgetHealth({
    totalBudget: data.totalBudget,
    totalEstimated: allocated,
    totalPaid: paid,
    currentSavings: cash,
    expenseCount: data.budgetItems.length + data.payments.length,
    monthsRemaining: monthsBetween(todayInApp(), data.weddingDate),
    remainingPay,
  });
  const completed = data.tasks.filter((t) => t.completed).length;
  const openDated = data.tasks.filter((t) => !t.completed && t.dueDate);
  const dueSoon = openDated
    .map((task) => ({ task, days: daysUntil(task.dueDate!) }))
    .filter((row) => row.days >= 0 && row.days <= 7)
    .sort((a, b) => a.days - b.days);
  const overdueCount = openDated.filter((task) => daysUntil(task.dueDate!) < 0).length;
  const openTasks = [...openDated].sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime()).slice(0, 5);
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

  const today = todayInApp();
  const week = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + offset);
    return date;
  });
  const paidPct = allocated > 0 ? Math.min(100, Math.round((paid / allocated) * 100)) : 0;
  const ring = 2 * Math.PI * 28;
  const months = Math.floor(Math.max(remaining, 0) / 30);
  const leftoverDays = Math.max(remaining, 0) % 30;
  const countdownWords =
    remaining < 0
      ? "Hari-H sudah lewat"
      : remaining === 0
        ? "Hari ini hari bahagianya"
        : months === 0
          ? `${leftoverDays} hari menuju hari bahagia`
          : leftoverDays === 0
            ? `${months} bulan menuju hari bahagia`
            : `${months} bulan ${leftoverDays} hari menuju hari bahagia`;

  return (
    <div className="mx-auto grid w-full max-w-lg gap-4 px-4 pt-5 pb-8">
      <HomeHero
        partnerAName={data.partnerAName}
        partnerBName={data.partnerBName}
        dateLabel={formatLongDate(data.weddingDate)}
        countdown={remaining >= 0 ? `H-${remaining}` : `H+${Math.abs(remaining)}`}
        countdownWords={countdownWords}
        week={week.map((date) => {
          const iso = date.toISOString().slice(0, 10);
          const isToday = iso === today.toISOString().slice(0, 10);
          const label = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" }).format(date);
          return { iso, day: date.getUTCDate(), label: isToday ? "Ini" : label.replace(".", ""), isToday };
        })}
        photos={[
          { slot: "cover", url: data.invitationCoverUrl },
          { slot: "photo2", url: data.invitationPhoto2 },
          { slot: "photo3", url: data.invitationPhoto3 },
        ].filter((photo): photo is { slot: string; url: string } => Boolean(photo.url))}
      />

      {dueSoon.length > 0 || overdueCount > 0 ? (
        <section className="surface px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Pengingat 7 hari</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {dueSoon.length > 0 ? `${dueSoon.length} tugas jatuh tempo dalam 7 hari.` : "Tidak ada tugas yang jatuh tempo dalam 7 hari."}
                {overdueCount > 0 ? ` ${overdueCount} tugas sudah lewat tenggat.` : ""}
              </p>
            </div>
            <Link href="/app/checklist" className="shrink-0 text-sm text-primary">
              Tugas
            </Link>
          </div>
          {dueSoon.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {dueSoon.map(({ task, days }) => (
                <li key={task.id} className="flex items-start justify-between gap-3 text-sm">
                  <p>{task.title}</p>
                  <span className="shrink-0 text-xs text-primary">{days === 0 ? "Hari ini" : `H-${days}`}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {data.loveNote ? (
        <section className="surface px-4 py-4 text-left">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">Catatan kalian</p>
          <p className="mt-2 text-sm leading-relaxed">{data.loveNote}</p>
        </section>
      ) : null}

      <section className="surface px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Kesehatan anggaran</h2>
          <span className="rounded-full bg-tone-marigold-soft px-2 py-0.5 text-xs font-medium text-tone-marigold">{health.label}</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <svg viewBox="0 0 72 72" className="size-20 -rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - paidPct / 100)}
            />
          </svg>
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-xs text-muted-foreground">Total terbayar · {paidPct}%</p>
            <p className="display text-xl">{formatRupiah(paid)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Rencana {formatRupiahCompact(allocated)}</p>
            <p className="text-xs text-muted-foreground">Sisa tagihan {formatRupiahCompact(remainingPay)}</p>
            <p className="text-xs text-muted-foreground">Plafon {formatRupiahCompact(data.totalBudget)}</p>
          </div>
        </div>
        <div className="mt-4">
          <PotBalances pots={pots} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Sisa anggaran {formatRupiah(Math.max(0, data.totalBudget - allocated))} · saldo rekening {formatRupiahCompact(cash)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{health.hint}</p>
      </section>

      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <Link href="/app/checklist" className="surface px-2 py-3">
          <p className="text-muted-foreground">Tugas</p>
          <p className="mt-1 font-medium">{completed}/{data.tasks.length}</p>
        </Link>
        <Link href="/app/guests" className="surface px-2 py-3">
          <p className="text-muted-foreground">Tamu hadir</p>
          <p className="mt-1 font-medium">{confirmedPax}</p>
        </Link>
        <Link href="/app/vendors" className="surface px-2 py-3">
          <p className="text-muted-foreground">Vendor deal</p>
          <p className="mt-1 font-medium">{bookedVendors}</p>
        </Link>
      </section>

      <section className="surface p-4">
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
          {categories.length ? (
            <ul className="mt-4 grid gap-2 border-t border-border pt-3">
              {categories.map((row) => (
                <li key={row.category} className="flex justify-between text-sm">
                  <span>{TASK_CATEGORY_LABELS[row.category as keyof typeof TASK_CATEGORY_LABELS] ?? row.category}</span>
                  <span className="text-muted-foreground">{row.remaining} tugas</span>
                </li>
              ))}
            </ul>
          ) : null}
      </section>
    </div>
  );
}
