import { createSeserahan, deleteSeserahan } from "@/app/actions/data";
import { EmptyState, PageHeader } from "@/components/chrome";
import { DeleteForm, Field, Input, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { SESERAHAN_CATEGORIES, SESERAHAN_CATEGORY_LABELS, SESERAHAN_STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatRupiah } from "@/lib/utils";

export default async function SeserahanPage() {
  const { wedding } = await requireWedding();
  const rows = await prisma.seserahanItem.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "desc" } });
  const total = rows.reduce((s, r) => s + (r.actualCost || r.estimatedCost), 0);
  return (
    <div>
      <PageHeader
        kicker="Seserahan"
        title="Isi nampan, harga, dan siapa yang belanja"
        description={`Total sementara ${formatRupiah(total)}. Item yang sudah dibeli masuk kartu Budget. Status bisa menunggu, disetujui, atau sudah dibeli.`}
        action={
          <Modal triggerLabel="Tambah item" title="Seserahan">
            <form action={createSeserahan} className="grid gap-4">
              <Field label="Nama">
                <Input name="name" required />
              </Field>
              <Field label="Kategori">
                <Select name="category" defaultValue="OTHER">
                  {SESERAHAN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {SESERAHAN_CATEGORY_LABELS[c]}
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
              <Field label="Yang membeli">
                <Input name="buyer" />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue="PENDING">
                  {Object.entries(SESERAHAN_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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
      {rows.length === 0 ? (
        <EmptyState title="Nampan masih kosong" description="Tambah item dari parfum sampai perlengkapan ibadah. Tidak terkunci." />
      ) : (
        <ul className="gutter grid gap-2">
          {rows.map((row) => (
            <li key={row.id} className="surface flex justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {SESERAHAN_CATEGORY_LABELS[row.category as keyof typeof SESERAHAN_CATEGORY_LABELS] ?? row.category} ·{" "}
                  {SESERAHAN_STATUS_LABELS[row.status as keyof typeof SESERAHAN_STATUS_LABELS]} · {formatRupiah(row.actualCost || row.estimatedCost)}
                  {row.buyer ? ` · ${row.buyer}` : ""}
                </p>
              </div>
              <DeleteForm action={deleteSeserahan.bind(null, row.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
