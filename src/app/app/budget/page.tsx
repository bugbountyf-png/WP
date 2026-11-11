import {
  createBudgetItem,
  createPayment,
  recordItemPayment,
  createSavings,
  createSavingsPot,
  deleteBudgetItem,
  deletePayment,
  deleteSavings,
  deleteSavingsPot,
  deleteSeserahan,
  deleteVendor,
  updateBudgetItem,
  updatePayment,
  updatePlafon,
  updateSavings,
  updateSeserahan,
  updateVendor,
} from "@/app/actions/data";
import { EmptyState, PageHeader, Stat } from "@/components/chrome";
import { DeleteForm, Field, Input, RowActions, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { budgetTotals, moneySide, paymentsForPlan, planKey, potLedgers } from "@/lib/budget";
import { materializePaidItems } from "@/lib/paid-sync";
import { budgetCategoryName, ensureBudgetCategories } from "@/lib/categories";
import { CategorySelect } from "@/components/category-select";
import { PotBalances, PotDisclosure } from "@/components/pot-balances";
import { PotSelect } from "@/components/pot-select";
import { ensureSavingsPots } from "@/lib/pots";
import { SESERAHAN_CATEGORIES, SESERAHAN_CATEGORY_LABELS, SESERAHAN_STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatRupiah, formatRupiahCompact, formatShortDate, toDateInput, todayInApp } from "@/lib/utils";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sumber?: string; rekening?: string; pot?: string; bayar?: string }>;
}) {
  const { tab, sumber, rekening, pot: potNotice, bayar } = await searchParams;
  const { wedding } = await requireWedding();
  await materializePaidItems(wedding.id);
  const [catalog, categories] = await Promise.all([ensureSavingsPots(wedding), ensureBudgetCategories(wedding.id)]);
  const [items, payments, savings, vendors, seserahan] = await Promise.all([
    prisma.budgetItem.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ where: { weddingId: wedding.id }, orderBy: { dueDate: "asc" } }),
    prisma.savingsEntry.findMany({ where: { weddingId: wedding.id }, orderBy: { occurredOn: "desc" } }),
    prisma.vendor.findMany({ where: { weddingId: wedding.id } }),
    prisma.seserahanItem.findMany({ where: { weddingId: wedding.id } }),
  ]);
  const { allocated, actual, paid, remainingPay, paymentUnpaid } = budgetTotals({
    items,
    payments,
    savings,
    vendors,
    seserahan,
  });
  const pots = potLedgers({ items, payments, savings, vendors, seserahan }, catalog);
  const showPayments = tab === "payments";
  const showSavings = tab === "tabungan";
  const sideFilter = catalog.some((pot) => pot.id === sumber) ? sumber! : "ALL";
  const coveredOf = (item: (typeof items)[number]) =>
    paymentsForPlan(item.name, item.vendorId, payments)
      .filter((row) => row.paidDate)
      .reduce((sum, row) => sum + row.amount, 0);
  const potsOf = (item: (typeof items)[number]) => {
    const names = paymentsForPlan(item.name, item.vendorId, payments)
      .filter((row) => row.paidDate)
      .map((row) => catalog.find((pot) => pot.id === moneySide(row.paidBy))?.name)
      .filter((name): name is string => Boolean(name));
    return [...new Set(names)];
  };
  const visibleItems =
    sideFilter === "ALL"
      ? items
      : items.filter((item) =>
          paymentsForPlan(item.name, item.vendorId, payments).some((row) => row.paidDate && moneySide(row.paidBy) === sideFilter),
        );
  const paidPayments = payments.filter((row) => row.paidDate);
  const lainnya = categories.find((row) => row.name.trim().toLowerCase() === "lainnya")?.id ?? categories[0]?.id;
  const categoryTotals = new Map<string, { estimated: number; paid: number; lines: Array<{ kind: "item" | "vendor" | "seserahan"; id: string }> }>();
  const bucketFor = (category: string) => {
    const current = categoryTotals.get(category) ?? { estimated: 0, paid: 0, lines: [] };
    categoryTotals.set(category, current);
    return current;
  };
  for (const item of visibleItems) {
    const bucket = bucketFor(item.category);
    bucket.estimated += item.actualCost || item.estimatedCost;
    bucket.paid += coveredOf(item);
    bucket.lines.push({ kind: "item", id: item.id });
  }
  const itemNames = new Set(items.map((item) => planKey(item.name)));
  for (const vendor of vendors) {
    if (vendor.status !== "BOOKED" && vendor.status !== "PAID") continue;
    const already = items.some((item) => item.vendorId === vendor.id || planKey(item.name) === planKey(vendor.name));
    if (already) continue;
    const onThisPot =
      sideFilter === "ALL" ||
      payments.some((row) => row.vendorId === vendor.id && moneySide(row.paidBy) === sideFilter);
    if (!onThisPot) continue;
    const bucket = bucketFor(vendor.category);
    bucket.estimated += vendor.price;
    bucket.paid += vendor.deposit;
    bucket.lines.push({ kind: "vendor", id: vendor.id });
  }
  for (const row of seserahan) {
    if (row.status === "REJECTED") continue;
    if (itemNames.has(planKey(row.name))) continue;
    if (sideFilter !== "ALL" && moneySide(row.buyer) !== sideFilter) continue;
    const bucket = bucketFor("DOWRY");
    bucket.estimated += row.estimatedCost;
    if (row.status === "PURCHASED") bucket.paid += row.actualCost || row.estimatedCost;
    bucket.lines.push({ kind: "seserahan", id: row.id });
  }
  const paidPct = wedding.totalBudget > 0 ? Math.min(100, Math.round((paid / wedding.totalBudget) * 100)) : 0;

  return (
    <div>
      <PageHeader
        kicker="Uang"
        title="Satu angka, satu layar"
        description="Anggaran untuk rencana biaya. Pembayaran untuk uang yang sudah keluar."
        action={
          showSavings ? (
            <Modal triggerLabel="Tambah tabungan" title="Setoran / penarikan">
              <form action={createSavings} className="grid gap-4">
                <Field label="Jenis">
                  <Select name="kind" defaultValue="DEPOSIT">
                    <option value="DEPOSIT">Setor</option>
                    <option value="WITHDRAWAL">Tarik</option>
                  </Select>
                </Field>
                <Field label="Nominal">
                  <Input name="amount" inputMode="numeric" required />
                </Field>
                <Field label="Tanggal">
                  <Input type="date" name="occurredOn" defaultValue={toDateInput(todayInApp())} required />
                </Field>
                <Field label="Masuk ke pot">
                  <PotSelect pots={catalog} name="side" defaultValue={catalog[0]?.id} />
                </Field>
                <Field label="Catatan">
                  <Input name="note" />
                </Field>
                <Submit>Simpan</Submit>
              </form>
            </Modal>
          ) : showPayments ? (
            <Modal triggerLabel="Tambah pembayaran" title="Uang yang sudah keluar">
              <form action={createPayment} className="grid gap-4">
                <Field label="Pos anggaran (opsional)">
                  <Select name="itemId" defaultValue="">
                    <option value="">Tidak tertaut</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Judul">
                  <Input name="title" required />
                </Field>
                <Field label="Nominal">
                  <Input name="amount" inputMode="numeric" required />
                </Field>
                <Field label="Tanggal bayar">
                  <Input type="date" name="paidDate" defaultValue={toDateInput(todayInApp())} required />
                </Field>
                <Field label="Uang dari">
                  <PotSelect pots={catalog} name="paidBy" />
                </Field>
                <Submit>Catat</Submit>
              </form>
            </Modal>
          ) : (
            <Modal triggerLabel="Tambah anggaran" title="Pos anggaran">
              <form action={createBudgetItem} className="grid gap-4">
                <Field label="Nama">
                  <Input name="name" required />
                </Field>
                <Field label="Kategori">
                  <CategorySelect categories={categories} name="category" defaultValue={lainnya} manage />
                </Field>
                <Field label="Vendor (opsional)">
                  <Select name="vendorId" defaultValue="">
                    <option value="">Tidak tertaut</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Perkiraan">
                  <Input name="estimatedCost" inputMode="numeric" />
                </Field>
                <Field label="Aktual">
                  <Input name="actualCost" inputMode="numeric" />
                </Field>
                <Field label="Catatan">
                  <Textarea name="notes" />
                </Field>
                <Submit>Tambah</Submit>
              </form>
            </Modal>
          )
        }
      />
      <div className="gutter mb-3">
        <Modal triggerLabel="Ubah plafon" variant="ghost" title="Plafon budget">
          <form action={updatePlafon} className="grid gap-4">
            <Field label="Total budget" hint="Angka ini yang jadi plafon di kartu atas.">
              <Input name="totalBudget" inputMode="numeric" defaultValue={String(wedding.totalBudget)} required />
            </Field>
            <Submit>Simpan plafon</Submit>
          </form>
        </Modal>
      </div>
      <div className="gutter hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
        <Stat label="Plafon" value={formatRupiah(wedding.totalBudget)} />
        <Stat
          label="Dialokasikan"
          value={formatRupiah(allocated)}
          hint={wedding.totalBudget ? `${Math.round((allocated / wedding.totalBudget) * 100)}% dari plafon` : undefined}
        />
        <Stat label="Aktual" value={formatRupiah(actual)} />
        <Stat label="Sudah dibayar" value={formatRupiah(paid)} />
        <Stat
          label="Sisa pelunasan"
          value={formatRupiah(remainingPay)}
          hint={paymentUnpaid > 0 ? "rencana yang belum lunas" : undefined}
        />
        <Stat label="Saldo rekening" value={formatRupiah(pots.reduce((sum, pot) => sum + pot.balance, 0))} hint={`setor ${formatRupiah(pots.reduce((sum, pot) => sum + pot.deposited, 0))} · keluar ${formatRupiah(pots.reduce((sum, pot) => sum + pot.spent, 0))}`} />
        {pots.map((pot) => (
          <Stat key={pot.pot} label={`Sisa ${pot.title}`} value={formatRupiah(pot.balance)} hint={`setor ${formatRupiah(pot.deposited)} · keluar ${formatRupiah(pot.spent)}`} />
        ))}
      </div>
      <div className="gutter mt-4">
        <PotBalances pots={pots} initialPot={catalog.some((pot) => pot.id === rekening) ? rekening! : null} />
        <p className="mt-2 text-xs text-muted-foreground">Saldo = saldo awal dikurangi yang terpakai. Ketuk rekening untuk melihat uangnya pergi ke mana.</p>
      </div>
      <div className="gutter mt-6 flex gap-2 text-sm">
        <a href="/app/budget" className={`shrink-0 rounded-full px-3 py-1.5 ${!showPayments && !showSavings ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Anggaran
        </a>
        <a href="/app/budget?tab=payments" className={`shrink-0 rounded-full px-3 py-1.5 ${showPayments ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Pembayaran
        </a>
        <a href="/app/budget?tab=tabungan" className={`shrink-0 rounded-full px-3 py-1.5 ${showSavings ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Tabungan
        </a>
      </div>
      {!showPayments && !showSavings ? (
        <div className="gutter mt-4 grid gap-4">
          <section className="surface p-4">
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-muted-foreground">Total target anggaran</p>
              <p className="display text-xl">{formatRupiah(wedding.totalBudget)}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <p>Estimasi<br /><span className="text-sm font-medium">{formatRupiahCompact(allocated)}</span></p>
              <p>Sudah dibayar<br /><span className="text-sm font-medium">{formatRupiahCompact(paid)}</span></p>
              <p>Sisa dana<br /><span className="text-sm font-medium">{formatRupiahCompact(Math.max(0, wedding.totalBudget - paid))}</span></p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{paidPct}% dari target terbayar</p>
          </section>
          {bayar === "pot" ? (
            <p className="text-xs text-muted-foreground">Pilih pot dulu, baru pembayaran ini tercatat.</p>
          ) : null}
          <div className="-mx-1 flex gap-2 overflow-x-auto">
            {[["", "Semua sumber"], ...catalog.map((pot) => [pot.id, pot.name] as const)].map(([id, label]) => (
              <a
                key={label}
                href={id ? `/app/budget?sumber=${id}` : "/app/budget"}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${sideFilter === (id || "ALL") ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {label}
              </a>
            ))}
          </div>
          <ul className="grid gap-2">
            {[...categoryTotals.entries()].map(([category, bucket]) => {
              const pct = bucket.estimated > 0 ? Math.min(100, Math.round((bucket.paid / bucket.estimated) * 100)) : 0;
              const label = budgetCategoryName(categories, category);
              return (
                <li key={category} className="surface p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium">{label}</p>
                    <p>{pct}%</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRupiah(bucket.paid)} / {formatRupiah(bucket.estimated)}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {bucket.lines.map((line) => {
                      if (line.kind === "item") {
                        const item = items.find((row) => row.id === line.id);
                        if (!item) return null;
                        const plan = item.actualCost || item.estimatedCost;
                        const covered = coveredOf(item);
                        const sisa = Math.max(0, plan - covered);
                        const potLabel = potsOf(item).join(", ");
                        const paidRows = paymentsForPlan(item.name, item.vendorId, payments).filter((row) => row.paidDate);
                        return (
                          <li key={item.id} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p>{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                perkiraan {formatRupiah(plan)} · dibayar {formatRupiah(covered)} · sisa {formatRupiah(sisa)}
                                {potLabel ? ` · ${potLabel}` : ""}
                              </p>
                            </div>
                            <RowActions>
                              {sisa > 0 ? (
                                <Modal triggerLabel="Bayar" variant="ghost" title={`DP atau pelunasan ${item.name}`}>
                                  <form action={recordItemPayment} className="grid gap-4">
                                    <input type="hidden" name="itemId" value={item.id} />
                                    <Field label="Nominal yang keluar" hint={`Boleh sebagian. Sisa rencana ${formatRupiah(sisa)}. Pot hanya berkurang sebesar angka ini.`}>
                                      <Input name="amount" inputMode="numeric" placeholder={String(sisa)} required />
                                    </Field>
                                    <Field label="Tanggal bayar">
                                      <Input type="date" name="paidDate" defaultValue={toDateInput(todayInApp())} required />
                                    </Field>
                                    <Field label="Uang dari">
                                      <PotSelect pots={catalog} name="paidBy" />
                                    </Field>
                                    <Submit>Catat pembayaran</Submit>
                                  </form>
                                </Modal>
                              ) : null}
                              {paidRows.length > 0 ? (
                                <Modal triggerLabel="Belum dibayar" variant="ghost" title="Jadikan belum dibayar">
                                  <ul className="grid gap-3">
                                    {paidRows.map((row) => (
                                      <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                                        <span>
                                          {formatRupiah(row.amount)} · {catalog.find((pot) => pot.id === moneySide(row.paidBy))?.name ?? "belum dipilih"}
                                        </span>
                                        <DeleteForm action={deletePayment.bind(null, row.id)} label="Batalkan" />
                                      </li>
                                    ))}
                                  </ul>
                                </Modal>
                              ) : null}
                              <Modal triggerLabel="Ubah" variant="ghost" title="Ubah anggaran">
                                <form action={updateBudgetItem} className="grid gap-4">
                                  <input type="hidden" name="id" value={item.id} />
                                  <Field label="Nama"><Input name="name" defaultValue={item.name} required /></Field>
                                  <Field label="Kategori">
                                    <CategorySelect categories={categories} name="category" defaultValue={item.category} />
                                  </Field>
                                  <Field label="Vendor (opsional)">
                                    <Select name="vendorId" defaultValue={item.vendorId ?? ""}>
                                      <option value="">Tidak tertaut</option>
                                      {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                      ))}
                                    </Select>
                                  </Field>
                                  <Field label="Perkiraan"><Input name="estimatedCost" inputMode="numeric" defaultValue={String(item.estimatedCost)} /></Field>
                                  <Field label="Aktual"><Input name="actualCost" inputMode="numeric" defaultValue={String(item.actualCost)} /></Field>
                                  <Field label="Catatan"><Textarea name="notes" defaultValue={item.notes ?? ""} /></Field>
                                  <Submit>Simpan</Submit>
                                </form>
                                <form action={recordItemPayment} className="mt-6 grid gap-4 border-t border-border pt-4">
                                  <input type="hidden" name="itemId" value={item.id} />
                                  <Field label="DP / sudah dibayar" hint={`Sudah tercatat ${formatRupiah(covered)}. Isi angka yang baru keluar, tidak harus sisa ${formatRupiah(sisa)}.`}>
                                    <Input name="amount" inputMode="numeric" placeholder="Nominal DP" required />
                                  </Field>
                                  <Field label="Tanggal bayar">
                                    <Input type="date" name="paidDate" defaultValue={toDateInput(todayInApp())} required />
                                  </Field>
                                  <Field label="Uang dari">
                                    <PotSelect pots={catalog} name="paidBy" />
                                  </Field>
                                  <Submit>Catat DP</Submit>
                                </form>
                              </Modal>
                              <DeleteForm action={deleteBudgetItem.bind(null, item.id)} />
                            </RowActions>
                          </li>
                        );
                      }
                      if (line.kind === "vendor") {
                        const vendor = vendors.find((row) => row.id === line.id);
                        if (!vendor) return null;
                        return (
                          <li key={vendor.id} className="flex items-center justify-between gap-2 text-sm">
                            <span>{vendor.name}</span>
                            <RowActions>
                              <Modal triggerLabel="Ubah" variant="ghost" title="Ubah vendor">
                                <form action={updateVendor} className="grid gap-4">
                                  <input type="hidden" name="id" value={vendor.id} />
                                  <input type="hidden" name="status" value={vendor.status} />
                                  <input type="hidden" name="recordBudget" value="yes" />
                                  <input type="hidden" name="deposit" value={String(vendor.deposit)} />
                                  <input type="hidden" name="rating" value={String(vendor.rating)} />
                                  <input type="hidden" name="contactName" value={vendor.contactName ?? ""} />
                                  <input type="hidden" name="instagram" value={vendor.instagram ?? ""} />
                                  <Field label="Nama"><Input name="name" defaultValue={vendor.name} required /></Field>
                                  <Field label="Kategori">
                                    <CategorySelect categories={categories} name="category" defaultValue={vendor.category} />
                                  </Field>
                                  <Field label="Harga kontrak"><Input name="price" inputMode="numeric" defaultValue={String(vendor.price)} /></Field>
                                  <Field label="Telepon"><Input name="phone" defaultValue={vendor.phone ?? ""} /></Field>
                                  <Field label="Lokasi"><Input name="location" defaultValue={vendor.location ?? ""} /></Field>
                                  <Field label="Catatan"><Textarea name="notes" defaultValue={vendor.notes ?? ""} /></Field>
                                  <Submit>Simpan</Submit>
                                </form>
                              </Modal>
                              <DeleteForm action={deleteVendor.bind(null, vendor.id)} />
                            </RowActions>
                          </li>
                        );
                      }
                      const row = seserahan.find((item) => item.id === line.id);
                      if (!row) return null;
                      return (
                        <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                          <span>{row.name}</span>
                          <RowActions>
                            <Modal triggerLabel="Ubah" variant="ghost" title="Ubah seserahan">
                              <form action={updateSeserahan} className="grid gap-4">
                                <input type="hidden" name="id" value={row.id} />
                                <Field label="Nama"><Input name="name" defaultValue={row.name} required /></Field>
                                <Field label="Kategori">
                                  <Select name="category" defaultValue={row.category}>
                                    {SESERAHAN_CATEGORIES.map((c) => (
                                      <option key={c} value={c}>{SESERAHAN_CATEGORY_LABELS[c]}</option>
                                    ))}
                                  </Select>
                                </Field>
                                <Field label="Perkiraan"><Input name="estimatedCost" inputMode="numeric" defaultValue={String(row.estimatedCost)} /></Field>
                                <Field label="Aktual"><Input name="actualCost" inputMode="numeric" defaultValue={String(row.actualCost)} /></Field>
                                <Field label="Status">
                                  <Select name="status" defaultValue={row.status}>
                                    {Object.entries(SESERAHAN_STATUS_LABELS).map(([value, statusLabel]) => (
                                      <option key={value} value={value}>{statusLabel}</option>
                                    ))}
                                  </Select>
                                </Field>
                                <Field label="Yang membeli">
                                  <PotSelect pots={catalog} name="buyer" defaultValue={moneySide(row.buyer)} allowEmpty />
                                </Field>
                                <Field label="Catatan"><Textarea name="notes" defaultValue={row.notes ?? ""} /></Field>
                                <Submit>Simpan</Submit>
                              </form>
                            </Modal>
                            <DeleteForm action={deleteSeserahan.bind(null, row.id)} />
                          </RowActions>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {showSavings ? (
        <div className="gutter mt-4">
          <form action={createSavingsPot} className="flex items-center gap-3">
            <Input name="name" placeholder="Nama pot baru" required className="min-w-0 flex-1" />
            <button type="submit" className="shrink-0 text-sm text-primary">
              Tambah pot
            </button>
          </form>
          {potNotice === "terpakai" ? (
            <p className="mt-2 text-xs text-muted-foreground">Pot ini masih punya setoran atau pengeluaran, jadi belum bisa dihapus.</p>
          ) : null}
          {potNotice === "ganda" ? <p className="mt-2 text-xs text-muted-foreground">Nama pot itu sudah ada.</p> : null}
        </div>
      ) : null}
      {showSavings ? (
        savings.length === 0 ? (
          <EmptyState title="Belum ada setoran" description="Catat saldo awal atau transfer pertama di sini, bukan di halaman terpisah." />
        ) : (
          <ul className="gutter mt-4 grid gap-3">
            {pots.map((pot) => (
              <PotDisclosure
                key={pot.pot}
                title={`Sisa ${pot.title}`}
                balance={formatRupiah(pot.balance)}
                trailing={
                  pot.pot ? (
                    <form action={deleteSavingsPot}>
                      <input type="hidden" name="id" value={pot.pot} />
                      <button type="submit" className="text-xs text-muted-foreground">
                        Hapus
                      </button>
                    </form>
                  ) : null
                }
              >
                <p className="text-xs text-muted-foreground">
                  Setoran {formatRupiah(pot.deposited)} · sudah keluar {formatRupiah(pot.spent)}
                </p>
                <ul className="mt-3 grid gap-2">
                  {pot.moves.map((move) => {
                    const row = savings.find((item) => item.id === move.id);
                    return (
                      <li key={move.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p>
                            {move.direction === "in"
                              ? move.label === "Setoran"
                                ? "Setoran"
                                : `Setoran · ${move.label}`
                              : `Keluar · ${move.label}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {move.when ? formatShortDate(move.when) : move.detail}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{move.direction === "in" ? "+" : "−"}{formatRupiah(move.amount)}</span>
                          {row ? (
                            <RowActions>
                              <Modal triggerLabel="Ubah" variant="ghost" title="Ubah tabungan">
                                <form action={updateSavings} className="grid gap-4">
                                  <input type="hidden" name="id" value={row.id} />
                                  <Field label="Jenis">
                                    <Select name="kind" defaultValue={row.amount < 0 ? "WITHDRAWAL" : "DEPOSIT"}>
                                      <option value="DEPOSIT">Setor</option>
                                      <option value="WITHDRAWAL">Tarik</option>
                                    </Select>
                                  </Field>
                                  <Field label="Nominal">
                                    <Input name="amount" inputMode="numeric" defaultValue={String(Math.abs(row.amount))} required />
                                  </Field>
                                  <Field label="Tanggal">
                                    <Input type="date" name="occurredOn" defaultValue={toDateInput(row.occurredOn)} required />
                                  </Field>
                                  <Field label="Masuk ke pot">
                                    <PotSelect pots={catalog} name="side" defaultValue={moneySide(row.side)} />
                                  </Field>
                                  <Field label="Catatan">
                                    <Input name="note" defaultValue={row.note ?? ""} />
                                  </Field>
                                  <Submit>Simpan</Submit>
                                </form>
                              </Modal>
                              <DeleteForm action={deleteSavings.bind(null, row.id)} />
                            </RowActions>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </PotDisclosure>
            ))}
          </ul>
        )
      ) : showPayments ? (
        paidPayments.length === 0 ? (
          <EmptyState title="Belum ada pembayaran" description="Uang yang sudah keluar dicatat di sini. Rencana yang belum dibayar tetap di tab Anggaran." />
        ) : (
          <>
          {bayar === "pot" ? (
            <p className="gutter mt-4 text-xs text-muted-foreground">Pilih pot dulu, baru pembayaran ini tercatat.</p>
          ) : null}
          <ul className="gutter mt-4 grid gap-2">
            {paidPayments.map((p) => (
              <li key={p.id} className="surface grid gap-3 p-4">
                <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRupiah(p.amount)} · {formatShortDate(p.paidDate ?? p.dueDate)} · {catalog.find((pot) => pot.id === moneySide(p.paidBy))?.name ?? "belum dipilih"}
                  </p>
                </div>
                <RowActions>
                  <Modal triggerLabel="Ubah" variant="ghost" title="Ubah pembayaran">
                    <form action={updatePayment} className="grid gap-4">
                      <input type="hidden" name="id" value={p.id} />
                      <Field label="Judul">
                        <Input name="title" defaultValue={p.title} required />
                      </Field>
                      <Field label="Nominal">
                        <Input name="amount" inputMode="numeric" defaultValue={String(p.amount)} required />
                      </Field>
                      <Field label="Tanggal bayar">
                        <Input type="date" name="paidDate" defaultValue={toDateInput(p.paidDate ?? p.dueDate)} required />
                      </Field>
                      <Field label="Uang dari">
                        <PotSelect pots={catalog} name="paidBy" defaultValue={moneySide(p.paidBy)} />
                      </Field>
                      <Submit>Simpan</Submit>
                    </form>
                  </Modal>
                  <DeleteForm action={deletePayment.bind(null, p.id)} label="Belum dibayar" />
                </RowActions>
                </div>
              </li>
            ))}
          </ul>
          </>
        )
      ) : categoryTotals.size === 0 ? (
        <EmptyState title="Belum ada anggaran" description="Catat rencana biaya di sini. Uang baru berkurang setelah dicatat di Pembayaran." />
      ) : null}
    </div>
  );
}
