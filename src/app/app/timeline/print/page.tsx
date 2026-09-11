import { PrintButton } from "@/components/print-button";
import { SONG_MOMENT_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatLongDate, minutesFromClock } from "@/lib/utils";

export default async function TimelinePrintPage() {
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
    <div className="print-sheet mx-auto max-w-3xl bg-white px-6 py-10 text-neutral-900">
      <style>{`
        @media print {
          aside, header, nav, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .print-sheet { max-width: none; padding: 0; }
        }
      `}</style>
      <div className="no-print mb-6 flex gap-2">
        <PrintButton />
        <a href="/app/timeline" className="inline-flex h-11 items-center text-sm text-muted-foreground">
          Kembali
        </a>
      </div>
      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">Rundown hari-H</p>
      <h1 className="display mt-1 text-4xl">
        {wedding.partnerAName} & {wedding.partnerBName}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {formatLongDate(wedding.weddingDate)} · {wedding.location}
      </p>
      {sortedRows.length === 0 ? (
        <p className="mt-8 text-sm">Rundown masih kosong.</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="py-2 pr-4">Jam</th>
              <th className="py-2 pr-4">Acara</th>
              <th className="py-2 pr-4">Lokasi</th>
              <th className="py-2">PIC</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-200 align-top">
                <td className="py-3 pr-4 font-mono">{row.time}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{row.title}</p>
                  {row.description ? <p className="text-neutral-600">{row.description}</p> : null}
                </td>
                <td className="py-3 pr-4">{row.location}</td>
                <td className="py-3">{row.pic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {songs.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-medium">Musik</h2>
          <ul className="mt-3 grid gap-1 text-sm">
            {songs.map((song) => (
              <li key={song.id}>
                {SONG_MOMENT_LABELS[song.moment as keyof typeof SONG_MOMENT_LABELS] ?? song.moment}: {song.title}
                {song.artist ? ` — ${song.artist}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
