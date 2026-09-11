import {
  createBudgetItem,
  createPayment,
  createSavings,
  deleteBudgetItem,
  deletePayment,
  deleteSavings,
  markPaymentPaid,
  updateBudgetItem,
  updatePayment,
  updatePlafon,
  updateSavings,
} from "@/app/actions/data";
import { EmptyState, PageHeader, Stat } from "@/components/chrome";
import { DeleteForm, Field, Input, RowActions, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { budgetTotals, monthsBetween } from "@/lib/budget";
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatRupiah, formatShortDate, toDateInput, todayInApp } from "@/lib/utils";
import { rowActionClass } from "@/components/ui";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const { wedding } = await requireWedding();
  const [items, payments, savings, vendors, seserahan] = await Promise.all([
    prisma.budgetItem.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ where: { weddingId: wedding.id }, orderBy: { dueDate: "asc" } }),
    prisma.savingsEntry.findMany({ where: { weddingId: wedding.id }, orderBy: { occurredOn: "desc" } }),
    prisma.vendor.findMany({ where: { weddingId: wedding.id } }),
    prisma.seserahanItem.findMany({ where: { weddingId: wedding.id } }),
  ]);
  const { allocated, actual, paid, remainingPay, saved, paymentUnpaid } = budgetTotals({
    items,
    payments,
    savings,
    vendors,
    seserahan,
  });
  const stillNeed = Math.max(0, wedding.totalBudget - saved);
  const months = monthsBetween(todayInApp(), wedding.weddingDate);
  const showPayments = tab === "payments";
  const showSavings = tab === "tabungan";

  return (
    <div>
      <PageHeader
        kicker="Uang"
        title="Satu angka, satu layar"
        description="Plafon, alokasi, aktual, yang sudah dibayar, sisa pelunasan, dan tabungan — tanpa pindah halaman."
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
                <Field label="Dari siapa">
                  <Select name="side" defaultValue="">
                    <option value="">Berdua / tidak spesifik</option>
                    <option value="PARTNER_A">{wedding.partnerAName}</option>
                    <option value="PARTNER_B">{wedding.partnerBName}</option>
                  </Select>
                </Field>
                <Field label="Catatan">
                  <Input name="note" />
                </Field>
                <Submit>Simpan</Submit>
              </form>
            </Modal>
          ) : showPayments ? (
            <Modal triggerLabel="Tambah pembayaran" title="Jadwal bayar">
              <form action={createPayment} className="grid gap-4">
                <Field label="Judul">
                  <Input name="title" required />
                </Field>
                <Field label="Nominal">
                  <Input name="amount" inputMode="numeric" required />
                </Field>
                <Field label="Jatuh tempo">
                  <Input type="date" name="dueDate" required />
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
                <Submit>Tambah</Submit>
              </form>
            </Modal>
          ) : (
            <Modal triggerLabel="Tambah pengeluaran" title="Pos budget">
              <form action={createBudgetItem} className="grid gap-4">
                <Field label="Nama">
                  <Input name="name" required />
                </Field>
                <Field label="Kategori">
                  <Select name="category" defaultValue="OTHER">
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {BUDGET_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
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
                <Field label="Sudah dibayar">
                  <Input name="paidAmount" inputMode="numeric" />
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
      <div className="gutter grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          hint={paymentUnpaid > 0 ? "jadwal yang belum ditandai lunas" : undefined}
        />
        <Stat label="Tabungan" value={formatRupiah(saved)} hint={`target ${formatRupiah(Math.ceil(stillNeed / months))}/bulan`} />
      </div>
      <div className="gutter mt-6 flex gap-3 text-sm">
        <a href="/app/budget" className={!showPayments && !showSavings ? "font-medium text-foreground" : "text-muted-foreground"}>
          Pengeluaran
        </a>
        <a href="/app/budget?tab=payments" className={showPayments ? "font-medium text-foreground" : "text-muted-foreground"}>
          Pembayaran
        </a>
        <a href="/app/budget?tab=tabungan" className={showSavings ? "font-medium text-foreground" : "text-muted-foreground"}>
          Tabungan
        </a>
      </div>
      {showSavings ? (
        savings.length === 0 ? (
          <EmptyState title="Belum ada setoran" description="Catat saldo awal atau transfer pertama di sini, bukan di halaman terpisah." />
        ) : (
          <ul className="gutter mt-4 grid gap-2">
            {savings.map((row) => (
              <li key={row.id} className="surface flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{formatRupiah(row.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(row.occurredOn)}
                    {row.note ? ` · ${row.note}` : ""}
                  </p>
                </div>
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
                      <Field label="Dari siapa">
                        <Select name="side" defaultValue={row.side ?? ""}>
                          <option value="">Berdua / tidak spesifik</option>
                          <option value="PARTNER_A">{wedding.partnerAName}</option>
                          <option value="PARTNER_B">{wedding.partnerBName}</option>
                        </Select>
                      </Field>
                      <Field label="Catatan">
                        <Input name="note" defaultValue={row.note ?? ""} />
                      </Field>
                      <Submit>Simpan</Submit>
                    </form>
                  </Modal>
                  <DeleteForm action={deleteSavings.bind(null, row.id)} />
                </RowActions>
              </li>
            ))}
          </ul>
        )
      ) : showPayments ? (
        payments.length === 0 ? (
          <EmptyState title="Belum ada jadwal bayar" description="Catat DP dan pelunasan supaya kalender ikut terisi." />
        ) : (
          <ul className="gutter mt-4 grid gap-2">
            {payments.map((p) => (
              <li key={p.id} className="surface flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRupiah(p.amount)} · {formatShortDate(p.dueDate)} {p.paidDate ? "· lunas" : ""}
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
                      <Field label="Jatuh tempo">
                        <Input type="date" name="dueDate" defaultValue={toDateInput(p.dueDate)} required />
                      </Field>
                      <Field label="Vendor (opsional)">
                        <Select name="vendorId" defaultValue={p.vendorId ?? ""}>
                          <option value="">Tidak tertaut</option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Submit>Simpan</Submit>
                    </form>
                  </Modal>
                  {!p.paidDate ? (
                    <form action={markPaymentPaid.bind(null, p.id)} className="contents">
                      <button type="submit" className={`${rowActionClass} text-primary`}>
                        Tandai lunas
                      </button>
                    </form>
                  ) : null}
                  <DeleteForm action={deletePayment.bind(null, p.id)} />
                </RowActions>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada pengeluaran" description="Mulai dari venue atau katering. Vendor yang di-booking bisa langsung tercatat di sini." />
      ) : (
        <ul className="gutter mt-4 grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="surface flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {BUDGET_CATEGORY_LABELS[item.category as keyof typeof BUDGET_CATEGORY_LABELS] ?? item.category} · perkiraan{" "}
                  {formatRupiah(item.estimatedCost)} · aktual {formatRupiah(item.actualCost || item.estimatedCost)} · dibayar {formatRupiah(item.paidAmount)}
                </p>
              </div>
              <RowActions>
                <Modal triggerLabel="Ubah" variant="ghost" title="Ubah pengeluaran">
                  <form action={updateBudgetItem} className="grid gap-4">
                    <input type="hidden" name="id" value={item.id} />
                    <Field label="Nama">
                      <Input name="name" defaultValue={item.name} required />
                    </Field>
                    <Field label="Kategori">
                      <Select name="category" defaultValue={item.category}>
                        {BUDGET_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {BUDGET_CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Vendor (opsional)">
                      <Select name="vendorId" defaultValue={item.vendorId ?? ""}>
                        <option value="">Tidak tertaut</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Perkiraan">
                      <Input name="estimatedCost" inputMode="numeric" defaultValue={String(item.estimatedCost)} />
                    </Field>
                    <Field label="Aktual">
                      <Input name="actualCost" inputMode="numeric" defaultValue={String(item.actualCost)} />
                    </Field>
                    <Field label="Sudah dibayar">
                      <Input name="paidAmount" inputMode="numeric" defaultValue={String(item.paidAmount)} />
                    </Field>
                    <Field label="Catatan">
                      <Textarea name="notes" defaultValue={item.notes ?? ""} />
                    </Field>
                    <Submit>Simpan</Submit>
                  </form>
                </Modal>
                <DeleteForm action={deleteBudgetItem.bind(null, item.id)} />
              </RowActions>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
