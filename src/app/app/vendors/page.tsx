import { createVendor, deleteResearch, deleteVendor, promoteResearch, updateVendor } from "@/app/actions/data";
import { EmptyState, PageHeader } from "@/components/chrome";
import { DeleteForm, Field, Input, RowActions, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { VENDOR_STATUSES, VENDOR_STATUS_LABELS } from "@/lib/labels";
import { CategorySelect } from "@/components/category-select";
import { budgetCategoryName, ensureBudgetCategories } from "@/lib/categories";
import { PotSelect } from "@/components/pot-select";
import { ensureSavingsPots } from "@/lib/pots";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatRupiah } from "@/lib/utils";
import { whatsappHref } from "@/lib/whatsapp";

const STEPS = [
  { status: "RESEARCHING", label: "Prospek" },
  { status: "NEGOTIATING", label: "Tanda jadi" },
  { status: "BOOKED", label: "Kontrak" },
  { status: "PAID", label: "Selesai" },
] as const;

function stepIndex(status: string) {
  if (status === "CONTACTED" || status === "RESEARCHING") return 0;
  if (status === "NEGOTIATING") return 1;
  if (status === "BOOKED") return 2;
  if (status === "PAID") return 3;
  return -1;
}

const PIPELINE = {
  riset: ["RESEARCHING", "CONTACTED"],
  proses: ["NEGOTIATING"],
  booked: ["BOOKED", "PAID"],
  batal: ["CANCELLED"],
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tahap?: string }>;
}) {
  const { tahap } = await searchParams;
  const { wedding } = await requireWedding();
  const [catalog, categories] = await Promise.all([ensureSavingsPots(wedding), ensureBudgetCategories(wedding.id)]);
  const [vendors, researches] = await Promise.all([
    prisma.vendor.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "desc" } }),
    prisma.research.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const filter =
    tahap === "riset"
      ? PIPELINE.riset
      : tahap === "proses"
        ? PIPELINE.proses
        : tahap === "booked"
          ? PIPELINE.booked
          : tahap === "batal"
            ? PIPELINE.batal
            : tahap === "semua"
              ? null
              : [...PIPELINE.riset, ...PIPELINE.proses, ...PIPELINE.booked];
  const rows = filter ? vendors.filter((v) => filter.includes(v.status)) : vendors;
  const deals = vendors.filter((vendor) => vendor.status === "BOOKED" || vendor.status === "PAID");
  const contractTotal = deals.reduce((sum, vendor) => sum + vendor.price, 0);
  const showLegacy = !tahap || tahap === "riset" || tahap === "semua";

  return (
    <div>
      <PageHeader
        kicker="Vendor"
        title="Dari riset sampai lunas"
        description="Satu pipeline: kandidat, negosiasi, booked, pelunasan. Vendor booked otomatis tercatat di budget dan jadwal bayar."
        action={
          <Modal triggerLabel="Tambah vendor" title="Vendor / kandidat">
            <form action={createVendor} className="grid gap-4">
              <Field label="Nama vendor">
                <Input name="name" required />
              </Field>
              <Field label="Kategori">
                <CategorySelect
                  categories={categories}
                  name="category"
                  defaultValue={categories.find((row) => row.name.trim().toLowerCase() === "wedding organizer")?.id}
                />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue="RESEARCHING">
                  {VENDOR_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {VENDOR_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Lokasi">
                <Input name="location" />
              </Field>
              <Field label="Rating 1-5">
                <Input name="rating" type="number" min={0} max={5} defaultValue={0} />
              </Field>
              <Field label="Harga">
                <Input name="price" inputMode="numeric" />
              </Field>
              <Field label="DP">
                <Input name="deposit" inputMode="numeric" />
              </Field>
              <Field label="DP dibayar dari">
                <PotSelect pots={catalog} name="paidBy" defaultValue={catalog[0]?.id} />
              </Field>
              <Field label="Kontak">
                <Input name="contactName" />
              </Field>
              <Field label="Telepon">
                <Input name="phone" />
              </Field>
              <Field label="Instagram">
                <Input name="instagram" />
              </Field>
              <Field label="Catat di budget">
                <Select name="recordBudget" defaultValue="no">
                  <option value="no">Belum</option>
                  <option value="yes">Ya, buat pos pengeluaran</option>
                </Select>
              </Field>
              <Field label="Catatan">
                <Textarea name="notes" />
              </Field>
              <Submit>Tambah</Submit>
            </form>
          </Modal>
        }
      />
      <section className="gutter">
        <div className="surface p-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">Total kontrak vendor deal</p>
            <p className="display text-xl">{formatRupiah(contractTotal)}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{deals.length} deal dari {vendors.length} vendor</p>
        </div>
      </section>
      <div className="gutter mt-4 flex flex-wrap gap-3 text-sm">
        <a href="/app/vendors" className={!tahap ? "font-medium text-foreground" : "text-muted-foreground"}>
          Aktif
        </a>
        <a href="/app/vendors?tahap=riset" className={tahap === "riset" ? "font-medium text-foreground" : "text-muted-foreground"}>
          Riset
        </a>
        <a href="/app/vendors?tahap=proses" className={tahap === "proses" ? "font-medium text-foreground" : "text-muted-foreground"}>
          Negosiasi
        </a>
        <a href="/app/vendors?tahap=booked" className={tahap === "booked" ? "font-medium text-foreground" : "text-muted-foreground"}>
          Booked
        </a>
        <a href="/app/vendors?tahap=semua" className={tahap === "semua" ? "font-medium text-foreground" : "text-muted-foreground"}>
          Semua
        </a>
      </div>
      {rows.length === 0 && researches.length === 0 ? (
        <EmptyState title="Belum ada vendor" description="Tambah kandidat dengan status riset. Yang menang nanti diubah jadi booked." />
      ) : (
        <ul className="gutter mt-4 grid gap-2">
          {showLegacy
            ? researches.map((row) => (
                <li key={row.id} className="surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Kandidat lama · {budgetCategoryName(categories, row.category)}
                        {row.location ? ` · ${row.location}` : ""}
                      </p>
                      <p className="mt-1 text-sm">
                        {formatRupiah(row.price)} {row.rating ? `· ${row.rating}/5` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <form action={promoteResearch.bind(null, row.id)}>
                        <button className="text-xs text-primary">Pindahkan ke pipeline</button>
                      </form>
                      <DeleteForm action={deleteResearch.bind(null, row.id)} />
                    </div>
                  </div>
                </li>
              ))
            : null}
          {rows.map((row) => (
            <li key={row.id} className="surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {budgetCategoryName(categories, row.category)} ·{" "}
                    {VENDOR_STATUS_LABELS[row.status as keyof typeof VENDOR_STATUS_LABELS] ?? row.status}
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    Nilai kontrak {formatRupiah(row.price)}
                  </p>
                  {row.phone ? (
                    <div className="mt-2 flex gap-3 text-sm">
                      <a href={`tel:${row.phone}`} className="text-primary">Telepon</a>
                      <a href={whatsappHref(row.phone, `Halo ${row.name}, saya ingin menanyakan vendor pernikahan kami.`)} className="text-primary">WhatsApp</a>
                    </div>
                  ) : null}
                </div>
                <RowActions>
                  <Modal triggerLabel="Ubah" variant="ghost" title="Ubah vendor">
                    <form action={updateVendor} className="grid gap-4">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value={row.status} />
                      <input type="hidden" name="recordBudget" value={row.status === "BOOKED" || row.status === "PAID" ? "yes" : "no"} />
                      <Field label="Nama"><Input name="name" defaultValue={row.name} required /></Field>
                      <Field label="Kategori">
                        <CategorySelect categories={categories} name="category" defaultValue={row.category} />
                      </Field>
                      <Field label="Harga"><Input name="price" inputMode="numeric" defaultValue={String(row.price)} /></Field>
                      <Field label="DP"><Input name="deposit" inputMode="numeric" defaultValue={String(row.deposit)} /></Field>
                      <Field label="Telepon"><Input name="phone" defaultValue={row.phone ?? ""} /></Field>
                      <Field label="Lokasi"><Input name="location" defaultValue={row.location ?? ""} /></Field>
                      <Field label="Kontak"><Input name="contactName" defaultValue={row.contactName ?? ""} /></Field>
                      <Field label="Instagram"><Input name="instagram" defaultValue={row.instagram ?? ""} /></Field>
                      <Field label="Rating"><Input name="rating" type="number" min={0} max={5} defaultValue={row.rating} /></Field>
                      <Field label="Catatan"><Textarea name="notes" defaultValue={row.notes ?? ""} /></Field>
                      <Submit>Simpan</Submit>
                    </form>
                  </Modal>
                  <DeleteForm action={deleteVendor.bind(null, row.id)} />
                </RowActions>
              </div>
              <form action={updateVendor} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="name" value={row.name} />
                <input type="hidden" name="category" value={row.category} />
                <input type="hidden" name="price" value={String(row.price)} />
                <input type="hidden" name="deposit" value={String(row.deposit)} />
                <input type="hidden" name="location" value={row.location ?? ""} />
                <input type="hidden" name="rating" value={String(row.rating)} />
                <input type="hidden" name="contactName" value={row.contactName ?? ""} />
                <input type="hidden" name="phone" value={row.phone ?? ""} />
                <input type="hidden" name="instagram" value={row.instagram ?? ""} />
                <input type="hidden" name="notes" value={row.notes ?? ""} />
                <div className="grid w-full grid-cols-4 gap-1">
                  {STEPS.map((step, index) => (
                    <button
                      key={step.status}
                      type="submit"
                      name="status"
                      value={step.status}
                      className={`rounded-md px-1 py-2 text-[0.65rem] ${index <= stepIndex(row.status) ? "bg-primary/15 font-medium text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
                <Select name="recordBudget" defaultValue={row.status === "BOOKED" || row.status === "PAID" ? "yes" : "no"} className="w-44">
                  <option value="no">Status saja</option>
                  <option value="yes">Catat di budget</option>
                </Select>
                <button className="h-11 rounded-lg px-3 text-sm text-primary">Simpan</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
