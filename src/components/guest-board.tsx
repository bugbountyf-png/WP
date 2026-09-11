"use client";

import { useMemo, useState } from "react";
import {
  assignGuestTable,
  createGuest,
  deleteGuest,
  importGuests,
  markGuestInvited,
  updateGuest,
} from "@/app/actions/data";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { GUEST_GROUPS, GUEST_GROUP_LABELS, INVITE_STATUS_LABELS, MEAL_LABELS, MEAL_PREFERENCES, RSVP_LABELS } from "@/lib/labels";
import { guestInvitePath } from "@/lib/invite";
import { invitationShareText, whatsappHref } from "@/lib/whatsapp";
import { guestSeats } from "@/lib/guests";
import { cn } from "@/lib/utils";

export type GuestRow = {
  id: string;
  name: string;
  side: string;
  groupName: string;
  phone: string | null;
  pax: number;
  plusOneAllowed: boolean;
  plusOneName: string | null;
  mealPreference: string;
  allergy: string | null;
  address: string | null;
  household: string | null;
  tableNumber: string | null;
  inviteToken: string | null;
  invitationStatus: string;
  rsvpStatus: string;
  notes: string | null;
};

export function GuestBoard({
  guests,
  partnerAName,
  partnerBName,
  invitationSlug,
  appOrigin,
  dateLabel,
  location,
}: {
  guests: GuestRow[];
  partnerAName: string;
  partnerBName: string;
  invitationSlug: string;
  appOrigin: string;
  dateLabel: string;
  location: string;
}) {
  const [tab, setTab] = useState<"list" | "seating">("list");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((guest) =>
      [guest.name, guest.phone, guest.household, guest.address, guest.plusOneName, guest.tableNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [guests, query]);

  return (
    <div className="gutter grid gap-6 pb-10">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddOpen(true)}>Tambah tamu</Button>
        <Button variant="secondary" onClick={() => setImportOpen(true)}>
          Impor CSV
        </Button>
        <a href="/app/guests/export" className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium">
          Export CSV
        </a>
        <a href="/app/guests/template.csv" className="inline-flex h-11 items-center text-sm text-muted-foreground">
          Unduh template
        </a>
      </div>
      <div className="flex gap-4 text-sm">
        <button className={cn(tab === "list" ? "font-medium text-foreground" : "text-muted-foreground")} onClick={() => setTab("list")}>
          Daftar
        </button>
        <button className={cn(tab === "seating" ? "font-medium text-foreground" : "text-muted-foreground")} onClick={() => setTab("seating")}>
          Denah meja
        </button>
      </div>
      {tab === "list" ? (
        <>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, rumah tangga, telepon…" />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada tamu yang cocok.</p>
          ) : (
            <ul className="grid gap-2">
              {filtered.map((guest) => (
                <GuestCard
                  key={guest.id}
                  guest={guest}
                  partnerAName={partnerAName}
                  partnerBName={partnerBName}
                  invitationSlug={invitationSlug}
                  appOrigin={appOrigin}
                  dateLabel={dateLabel}
                  location={location}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <SeatingChart guests={guests} partnerAName={partnerAName} partnerBName={partnerBName} />
      )}

      {addOpen ? (
        <Sheet title="Tamu baru" onClose={() => setAddOpen(false)}>
          <form
            action={async (formData) => {
              await createGuest(formData);
              setAddOpen(false);
            }}
            className="grid gap-4"
          >
            <GuestFields partnerAName={partnerAName} partnerBName={partnerBName} />
            <Button type="submit">Tambah</Button>
          </form>
        </Sheet>
      ) : null}

      {importOpen ? (
        <Sheet title="Impor CSV" onClose={() => setImportOpen(false)}>
          <form
            action={async (formData) => {
              const result = await importGuests(formData);
              setImportMessage(result.message ?? result.error ?? "");
              if (result.message) setImportOpen(false);
            }}
            className="grid gap-4"
          >
            <p className="text-sm text-muted-foreground">
              Header: nama, sisi, kelompok, telepon, pax, plus_one, menu, alergi, alamat, rumah_tangga, meja.
            </p>
            <Field label="File CSV">
              <Input type="file" name="file" accept=".csv,text/csv" required />
            </Field>
            {importMessage ? <p className="text-sm text-destructive">{importMessage}</p> : null}
            <Button type="submit">Impor</Button>
          </form>
        </Sheet>
      ) : null}
    </div>
  );
}

function GuestCard({
  guest,
  partnerAName,
  partnerBName,
  invitationSlug,
  appOrigin,
  dateLabel,
  location,
}: {
  guest: GuestRow;
  partnerAName: string;
  partnerBName: string;
  invitationSlug: string;
  appOrigin: string;
  dateLabel: string;
  location: string;
}) {
  const [open, setOpen] = useState(false);
  const url = `${appOrigin}${guestInvitePath(invitationSlug, guest.inviteToken, guest.name)}`;
  const wa = whatsappHref(
    guest.phone,
    invitationShareText({
      guestName: guest.name,
      partnerAName,
      partnerBName,
      url,
      dateLabel,
      location,
    }),
  );
  return (
    <li className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" className="min-w-0 text-left" onClick={() => setOpen(true)}>
          <p className="font-medium">{guest.name}</p>
          <p className="text-xs text-muted-foreground">
            {guestSeats(guest, "listed")} kursi
            {guest.plusOneName ? ` · + ${guest.plusOneName}` : guest.plusOneAllowed ? " · termasuk plus-one" : ""}
            {" · "}
            {guest.side === "PARTNER_B" ? partnerBName : partnerAName}
            {" · "}
            {GUEST_GROUP_LABELS[guest.groupName as keyof typeof GUEST_GROUP_LABELS] ?? guest.groupName}
            {" · "}
            {INVITE_STATUS_LABELS[guest.invitationStatus as keyof typeof INVITE_STATUS_LABELS]}
            {" · "}
            {RSVP_LABELS[guest.rsvpStatus as keyof typeof RSVP_LABELS]}
            {guest.tableNumber ? ` · meja ${guest.tableNumber}` : ""}
          </p>
          {guest.mealPreference !== "STANDARD" || guest.allergy ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {MEAL_LABELS[guest.mealPreference as keyof typeof MEAL_LABELS] ?? guest.mealPreference}
              {guest.allergy ? ` · alergi ${guest.allergy}` : ""}
            </p>
          ) : null}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary"
            onClick={() => {
              void markGuestInvited(guest.id);
            }}
          >
            Kirim WA
          </a>
          <form action={deleteGuest.bind(null, guest.id)}>
            <button className="text-xs text-muted-foreground hover:text-destructive">Hapus</button>
          </form>
        </div>
      </div>
      {open ? (
        <Sheet title="Ubah tamu" onClose={() => setOpen(false)}>
          <form
            action={async (formData) => {
              await updateGuest(formData);
              setOpen(false);
            }}
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={guest.id} />
            <GuestFields guest={guest} partnerAName={partnerAName} partnerBName={partnerBName} />
            <p className="break-all text-xs text-muted-foreground">Tautan personal: {url}</p>
            <Button type="submit">Simpan</Button>
          </form>
        </Sheet>
      ) : null}
    </li>
  );
}

function GuestFields({
  guest,
  partnerAName,
  partnerBName,
}: {
  guest?: GuestRow;
  partnerAName: string;
  partnerBName: string;
}) {
  return (
    <>
      <Field label="Nama">
        <Input name="name" defaultValue={guest?.name ?? ""} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sisi">
          <Select name="side" defaultValue={guest?.side ?? "PARTNER_A"}>
            <option value="PARTNER_A">{partnerAName}</option>
            <option value="PARTNER_B">{partnerBName}</option>
          </Select>
        </Field>
        <Field label="Kelompok">
          <Select name="groupName" defaultValue={guest?.groupName ?? "FAMILY"}>
            {GUEST_GROUPS.map((g) => (
              <option key={g} value={g}>
                {GUEST_GROUP_LABELS[g]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jumlah orang" hint="Termasuk plus-one, kalau diizinkan.">
          <Input type="number" name="pax" min={1} defaultValue={guest?.pax ?? 1} />
        </Field>
        <Field label="Telepon">
          <Input name="phone" defaultValue={guest?.phone ?? ""} placeholder="0812…" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plus-one">
          <Select name="plusOneAllowed" defaultValue={guest?.plusOneAllowed ? "yes" : "no"}>
            <option value="no">Tidak</option>
            <option value="yes">Boleh membawa 1 orang</option>
          </Select>
        </Field>
        <Field label="Nama plus-one">
          <Input name="plusOneName" defaultValue={guest?.plusOneName ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Menu">
          <Select name="mealPreference" defaultValue={guest?.mealPreference ?? "STANDARD"}>
            {MEAL_PREFERENCES.map((m) => (
              <option key={m} value={m}>
                {MEAL_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Alergi">
          <Input name="allergy" defaultValue={guest?.allergy ?? ""} />
        </Field>
      </div>
      <Field label="Rumah tangga / rombongan">
        <Input name="household" defaultValue={guest?.household ?? ""} />
      </Field>
      <Field label="Alamat">
        <Input name="address" defaultValue={guest?.address ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meja">
          <Input name="tableNumber" defaultValue={guest?.tableNumber ?? ""} placeholder="1" />
        </Field>
        <Field label="Undangan">
          <Select name="invitationStatus" defaultValue={guest?.invitationStatus ?? "NOT_INVITED"}>
            <option value="NOT_INVITED">Belum diundang</option>
            <option value="INVITED">Sudah diundang</option>
          </Select>
        </Field>
      </div>
      <Field label="RSVP">
        <Select name="rsvpStatus" defaultValue={guest?.rsvpStatus ?? "PENDING"}>
          <option value="PENDING">Belum konfirmasi</option>
          <option value="CONFIRMED">Hadir</option>
          <option value="DECLINED">Tidak hadir</option>
        </Select>
      </Field>
      <Field label="Catatan">
        <Textarea name="notes" defaultValue={guest?.notes ?? ""} />
      </Field>
    </>
  );
}

function SeatingChart({
  guests,
  partnerAName,
  partnerBName,
}: {
  guests: GuestRow[];
  partnerAName: string;
  partnerBName: string;
}) {
  const confirmed = guests.filter((g) => g.rsvpStatus === "CONFIRMED");
  const tables = new Map<string, GuestRow[]>();
  const unseated: GuestRow[] = [];
  for (const guest of confirmed) {
    if (guest.tableNumber) {
      const list = tables.get(guest.tableNumber) ?? [];
      list.push(guest);
      tables.set(guest.tableNumber, list);
    } else {
      unseated.push(guest);
    }
  }
  const numbered = [...tables.entries()].sort((a, b) => a[0].localeCompare(b[0], "id", { numeric: true }));
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        {confirmed.reduce((s, g) => s + guestSeats(g, "confirmed"), 0)} kursi dari tamu yang sudah konfirmasi hadir. Isi nomor meja, denahnya muncul di sini.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {numbered.map(([number, rows]) => (
          <article key={number} className="surface p-4">
            <h3 className="font-medium">Meja {number}</h3>
            <p className="text-xs text-muted-foreground">{rows.reduce((s, g) => s + guestSeats(g, "confirmed"), 0)} kursi</p>
            <ul className="mt-3 grid gap-2">
              {rows.map((guest) => (
                <li key={guest.id} className="text-sm">
                  {guest.name}
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {guestSeats(guest, "confirmed")} · {guest.side === "PARTNER_B" ? partnerBName : partnerAName}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {unseated.length ? (
        <section>
          <h3 className="text-sm font-medium">Belum ada meja</h3>
          <ul className="mt-3 grid gap-2">
            {unseated.map((guest) => (
              <li key={guest.id} className="surface flex items-center justify-between gap-3 p-3">
                <span className="text-sm">
                  {guest.name} <span className="text-muted-foreground">· {guestSeats(guest, "confirmed")} kursi</span>
                </span>
                <form action={assignGuestTable} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={guest.id} />
                  <Input name="tableNumber" placeholder="Meja" className="h-9 w-20" />
                  <Button type="submit" size="sm" variant="secondary">
                    Simpan
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <button className="absolute inset-0 bg-foreground/30" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="display text-2xl">{title}</h2>
          <button className="text-sm text-muted-foreground" onClick={onClose}>
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
