import { createSong, createTimeline, deleteSong, deleteTimeline, updateSong, updateTimeline } from "@/app/actions/data";
import { EmptyState, PageHeader } from "@/components/chrome";
import { DeleteForm, Field, Input, RowActions, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { SONG_MOMENTS, SONG_MOMENT_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { minutesFromClock } from "@/lib/utils";

export default async function TimelinePage() {
  const { wedding } = await requireWedding();
  const [rows, songs] = await Promise.all([
    prisma.timelineEvent.findMany({
      where: { weddingId: wedding.id },
      orderBy: [{ time: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.song.findMany({ where: { weddingId: wedding.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const sortedRows = [...rows].sort(
    (a, b) => minutesFromClock(a.time) - minutesFromClock(b.time) || a.sortOrder - b.sortOrder,
  );

  return (
    <div>
      <PageHeader
        kicker="Hari-H"
        title="Rundown jam per jam"
        description="Kirim PDF ini ke WO, MC, dan kedua keluarga. Playlist lagu ada di bawah rundown, bukan menu terpisah."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="/app/timeline/print"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              Rundown PDF
            </a>
            <Modal triggerLabel="Tambah acara" title="Acara rundown">
              <form action={createTimeline} className="grid gap-4">
                <Field label="Jam" hint="Format 24 jam, misalnya 09:30">
                  <Input name="time" placeholder="09:30" required />
                </Field>
                <Field label="Judul">
                  <Input name="title" required />
                </Field>
                <Field label="Lokasi">
                  <Input name="location" />
                </Field>
                <Field label="PIC">
                  <Input name="pic" />
                </Field>
                <Field label="Deskripsi">
                  <Textarea name="description" />
                </Field>
                <Submit>Tambah</Submit>
              </form>
            </Modal>
          </div>
        }
      />
      {sortedRows.length === 0 ? (
        <EmptyState title="Rundown masih kosong" description="Mulai dari makeup, akad, lalu resepsi. Bisa sepanjang yang kalian butuh." />
      ) : (
        <ol className="gutter grid gap-2">
          {sortedRows.map((row) => (
            <li key={row.id} className="surface flex justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-mono text-primary">{row.time}</p>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{[row.location, row.pic].filter(Boolean).join(" · ")}</p>
                {row.description ? <p className="mt-1 text-sm text-muted-foreground">{row.description}</p> : null}
              </div>
              <RowActions>
                <Modal triggerLabel="Ubah" variant="ghost" title="Ubah acara">
                  <form action={updateTimeline} className="grid gap-4">
                    <input type="hidden" name="id" value={row.id} />
                    <Field label="Jam"><Input name="time" defaultValue={row.time} required /></Field>
                    <Field label="Judul"><Input name="title" defaultValue={row.title} required /></Field>
                    <Field label="Lokasi"><Input name="location" defaultValue={row.location ?? ""} /></Field>
                    <Field label="PIC"><Input name="pic" defaultValue={row.pic ?? ""} /></Field>
                    <Field label="Deskripsi"><Textarea name="description" defaultValue={row.description ?? ""} /></Field>
                    <Submit>Simpan</Submit>
                  </form>
                </Modal>
                <DeleteForm action={deleteTimeline.bind(null, row.id)} />
              </RowActions>
            </li>
          ))}
        </ol>
      )}

      <section className="gutter mt-12 pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="display text-2xl">Musik</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lagu per momen, dikirim bareng rundown ke MC atau DJ.</p>
          </div>
          <Modal triggerLabel="Tambah lagu" title="Lagu">
            <form action={createSong} className="grid gap-4">
              <Field label="Judul lagu">
                <Input name="title" required />
              </Field>
              <Field label="Artis">
                <Input name="artist" />
              </Field>
              <Field label="Momen">
                <Select name="moment" defaultValue="OTHER">
                  {SONG_MOMENTS.map((m) => (
                    <option key={m} value={m}>
                      {SONG_MOMENT_LABELS[m]}
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
        </div>
        {songs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada lagu. Tambah entrance dulu.</p>
        ) : (
          <ul className="grid gap-2">
            {songs.map((row) => (
              <li key={row.id} className="surface flex justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.artist ? `${row.artist} · ` : ""}
                    {SONG_MOMENT_LABELS[row.moment as keyof typeof SONG_MOMENT_LABELS] ?? row.moment}
                  </p>
                </div>
                <RowActions>
                  <Modal triggerLabel="Ubah" variant="ghost" title="Ubah lagu">
                    <form action={updateSong} className="grid gap-4">
                      <input type="hidden" name="id" value={row.id} />
                      <Field label="Judul lagu"><Input name="title" defaultValue={row.title} required /></Field>
                      <Field label="Artis"><Input name="artist" defaultValue={row.artist ?? ""} /></Field>
                      <Field label="Momen">
                        <Select name="moment" defaultValue={row.moment}>
                          {SONG_MOMENTS.map((m) => (
                            <option key={m} value={m}>{SONG_MOMENT_LABELS[m]}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Catatan"><Textarea name="notes" defaultValue={row.notes ?? ""} /></Field>
                      <Submit>Simpan</Submit>
                    </form>
                  </Modal>
                  <DeleteForm action={deleteSong.bind(null, row.id)} />
                </RowActions>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
