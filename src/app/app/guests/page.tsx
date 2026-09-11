import { GuestBoard } from "@/components/guest-board";
import { EmptyState, PageHeader, Stat } from "@/components/chrome";
import { appUrl } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { formatLongDate } from "@/lib/utils";
import { guestSeats } from "@/lib/guests";

export default async function GuestsPage() {
  const { wedding } = await requireWedding();
  const rows = await prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" } });
  const pax = rows.reduce((s, g) => s + guestSeats(g, "listed"), 0);
  const confirmed = rows.reduce((s, g) => s + guestSeats(g, "confirmed"), 0);
  return (
    <div>
      <PageHeader
        kicker="Tamu"
        title="Siapa yang datang, dan di meja mana"
        description={`Perkiraan awal ${wedding.estimatedGuests} orang. RSVP dari undangan masuk ke daftar ini. Kirim undangan lewat WhatsApp per nama.`}
      />
      <div className="gutter grid gap-3 sm:grid-cols-3">
        <Stat label="Nama" value={String(rows.length)} />
        <Stat label="Kursi tercatat" value={String(pax)} />
        <Stat label="Konfirmasi hadir" value={String(confirmed)} />
      </div>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Daftar tamu masih kosong" description="Tambah keluarga, impor CSV, atau tunggu RSVP dari tautan undangan." />
          <GuestBoard
            guests={[]}
            partnerAName={wedding.partnerAName}
            partnerBName={wedding.partnerBName}
            invitationSlug={wedding.invitationSlug}
            appOrigin={appUrl()}
            dateLabel={formatLongDate(wedding.weddingDate)}
            location={wedding.location}
          />
        </div>
      ) : (
        <div className="mt-6">
          <GuestBoard
            guests={rows}
            partnerAName={wedding.partnerAName}
            partnerBName={wedding.partnerBName}
            invitationSlug={wedding.invitationSlug}
            appOrigin={appUrl()}
            dateLabel={formatLongDate(wedding.weddingDate)}
            location={wedding.location}
          />
        </div>
      )}
    </div>
  );
}
