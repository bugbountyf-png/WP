"use client";

import { CopyButton } from "@/components/copy-button";
import type { InvitationData } from "@/lib/invite";
import { mapsEmbedUrl } from "@/lib/invite";
import { formatLongDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function InvitationView({
  wedding,
  guestName,
  compact = false,
}: {
  wedding: InvitationData;
  guestName?: string | null;
  compact?: boolean;
}) {
  const names = `${wedding.partnerAName} & ${wedding.partnerBName}`;
  const gallery = [wedding.invitationPhoto2, wedding.invitationPhoto3].filter(Boolean) as string[];
  const maps = wedding.mapsUrl || wedding.location;

  return (
    <article className={cn("overflow-hidden bg-[#f7f3ec] text-[#2c241c]", compact ? "rounded-2xl border border-[#e4d9c8]" : "")}>
      {wedding.musicUrl && !compact ? <audio className="hidden" src={wedding.musicUrl} autoPlay loop /> : null}
      <div className={cn("relative overflow-hidden", compact ? "h-44" : "h-72 sm:h-96")}>
        {wedding.invitationCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wedding.invitationCoverUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-[radial-gradient(80%_80%_at_50%_20%,#d7efe8,transparent_70%),linear-gradient(180deg,#2f6f68,#1b2a28)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c241c]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <p className="text-[0.65rem] tracking-[0.28em] uppercase opacity-80">The wedding of</p>
          <h1 className="display mt-1 text-3xl leading-tight sm:text-4xl">{names}</h1>
        </div>
      </div>
      <div className="grid gap-8 px-6 py-10 text-center">
        {guestName ? (
          <p className="text-sm">
            Kepada Yth.
            <br />
            <span className="display text-2xl">{guestName}</span>
          </p>
        ) : (
          <p className="text-sm text-[#6b5e52]">Untuk yang terkasih</p>
        )}
        <p className="text-sm tracking-wide">{formatLongDate(wedding.weddingDate)}</p>
        {wedding.invitationStory ? <p className="text-sm leading-relaxed text-[#5a4e44]">{wedding.invitationStory}</p> : null}

        <div className="grid gap-4 text-sm">
          {wedding.ceremonyTime || wedding.ceremonyVenue ? (
            <div className="rounded-2xl bg-white/70 px-4 py-4">
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#6b5e52]">Akad</p>
              <p className="mt-1 font-medium">{wedding.ceremonyTime || "Pagi"}</p>
              <p className="text-[#6b5e52]">{wedding.ceremonyVenue || wedding.location}</p>
            </div>
          ) : null}
          {wedding.receptionTime || wedding.receptionVenue ? (
            <div className="rounded-2xl bg-white/70 px-4 py-4">
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#6b5e52]">Resepsi</p>
              <p className="mt-1 font-medium">{wedding.receptionTime || "Siang"}</p>
              <p className="text-[#6b5e52]">{wedding.receptionVenue || wedding.location}</p>
            </div>
          ) : (
            <p>{wedding.location}</p>
          )}
          {wedding.dressCode ? <p>Dress code: {wedding.dressCode}</p> : null}
        </div>

        {gallery.length ? (
          <div className={cn("grid gap-3", gallery.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {gallery.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-36 w-full rounded-2xl object-cover sm:h-44" />
            ))}
          </div>
        ) : null}

        {maps ? (
          <div className="overflow-hidden rounded-2xl">
            <iframe
              title="Peta lokasi"
              src={mapsEmbedUrl(wedding.location, wedding.mapsUrl)}
              className="h-48 w-full border-0"
              loading="lazy"
            />
            {wedding.mapsUrl ? (
              <a href={wedding.mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4">
                Buka di Google Maps
              </a>
            ) : null}
          </div>
        ) : null}

        {wedding.bankAccountNumber ? (
          <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm">
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#6b5e52]">Amplop digital</p>
            <p className="mt-2 font-medium">{wedding.bankName}</p>
            <p>{wedding.bankAccountName}</p>
            <p className="mt-1 font-mono">{wedding.bankAccountNumber}</p>
            <div className="mt-2">
              <CopyButton value={wedding.bankAccountNumber} label="Salin nomor rekening" />
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
