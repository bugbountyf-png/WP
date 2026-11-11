"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearInvitationPhoto, uploadInvitationPhoto } from "@/app/actions/wedding";

const SLOTS = [
  { slot: "cover", label: "Foto 1" },
  { slot: "photo2", label: "Foto 2" },
  { slot: "photo3", label: "Foto 3" },
] as const;

export function HomeHero({
  partnerAName,
  partnerBName,
  dateLabel,
  countdown,
  countdownWords,
  week,
  photos,
}: {
  partnerAName: string;
  partnerBName: string;
  dateLabel: string;
  countdown: string;
  countdownWords: string;
  week: Array<{ iso: string; day: number; label: string; isToday: boolean }>;
  photos: Array<{ slot: string; url: string }>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const urls = photos.map((photo) => photo.url);

  useEffect(() => {
    if (urls.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % urls.length), 5000);
    return () => window.clearInterval(timer);
  }, [urls.length]);

  async function upload(formData: FormData) {
    setMessage("");
    const result = await uploadInvitationPhoto(formData);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Foto tersimpan.");
    router.refresh();
  }

  return (
    <section className="surface relative overflow-hidden px-4 py-5 text-center">
      {urls.map((src, photoIndex) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${photoIndex === index % urls.length ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {urls.length > 0 ? <div className="absolute inset-0 bg-background/65" /> : null}
      <div className="relative">
        <h1 className="display text-3xl">
          {partnerAName} & {partnerBName}
        </h1>
        <p className="mt-1 text-sm text-primary">{dateLabel}</p>
        <div className="mt-5 flex items-center justify-between gap-1">
          {week.map((date) => (
            <div
              key={date.iso}
              className={`grid w-10 justify-items-center rounded-full py-2 text-xs ${date.isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              <span className="text-sm font-medium">{date.day}</span>
              <span>{date.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-muted/70 px-4 py-4">
          <p className="display text-3xl">{countdown}</p>
          <p className="mt-1 text-sm text-muted-foreground">{countdownWords}</p>
        </div>
        {urls.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {urls.map((src, photoIndex) => (
              <button
                key={src}
                type="button"
                aria-label={`Foto ${photoIndex + 1}`}
                className={`size-1.5 rounded-full ${photoIndex === index % urls.length ? "bg-primary" : "bg-muted-foreground/40"}`}
                onClick={() => setIndex(photoIndex)}
              />
            ))}
          </div>
        ) : null}
        <button type="button" className="mt-3 text-sm text-primary" onClick={() => setEditing((open) => !open)}>
          {editing ? "Tutup foto" : urls.length ? "Ubah foto" : "Tambah foto"}
        </button>
        {editing ? (
          <div className="mt-3 grid gap-3 text-left">
            {SLOTS.map((item) => {
              const current = photos.find((photo) => photo.slot === item.slot);
              return (
                <div key={item.slot} className="rounded-xl bg-muted/70 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <form action={upload} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="slot" value={item.slot} />
                    <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="max-w-full text-xs" required />
                    <button type="submit" className="text-sm text-primary">
                      Simpan
                    </button>
                  </form>
                  {current ? (
                    <form action={clearInvitationPhoto} className="mt-1">
                      <input type="hidden" name="slot" value={item.slot} />
                      <button type="submit" className="text-xs text-muted-foreground">
                        Hapus foto ini
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
            {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
            <p className="text-xs text-muted-foreground">Lebih dari satu foto akan bergeser sendiri setiap 5 detik. Foto yang sama juga tampil di undangan.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
