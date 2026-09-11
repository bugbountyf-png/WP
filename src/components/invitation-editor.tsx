"use client";

import { useActionState, useState } from "react";
import { updateInvitationAction, uploadInvitationPhoto } from "@/app/actions/wedding";
import { InvitationView } from "@/components/invitation-view";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { emptyActionState, wrapAction } from "@/lib/form-state";
import type { InvitationData } from "@/lib/invite";
import { whatsappHref } from "@/lib/whatsapp";

export function InvitationEditor({
  wedding,
  publicUrl,
  shareText,
}: {
  wedding: InvitationData & { invitationSlug: string };
  publicUrl: string;
  shareText: string;
}) {
  const [state, action] = useActionState(wrapAction(updateInvitationAction), emptyActionState);
  const [preview, setPreview] = useState<InvitationData>(wedding);

  function sync(form: HTMLFormElement) {
    const data = new FormData(form);
    setPreview({
      ...wedding,
      invitationStory: String(data.get("invitationStory") ?? "") || null,
      invitationCoverUrl: String(data.get("invitationCoverUrl") ?? "") || wedding.invitationCoverUrl,
      invitationPhoto2: String(data.get("invitationPhoto2") ?? "") || wedding.invitationPhoto2,
      invitationPhoto3: String(data.get("invitationPhoto3") ?? "") || wedding.invitationPhoto3,
      ceremonyTime: String(data.get("ceremonyTime") ?? "") || null,
      ceremonyVenue: String(data.get("ceremonyVenue") ?? "") || null,
      receptionTime: String(data.get("receptionTime") ?? "") || null,
      receptionVenue: String(data.get("receptionVenue") ?? "") || null,
      mapsUrl: String(data.get("mapsUrl") ?? "") || null,
      dressCode: String(data.get("dressCode") ?? "") || null,
      bankName: String(data.get("bankName") ?? "") || null,
      bankAccountName: String(data.get("bankAccountName") ?? "") || null,
      bankAccountNumber: String(data.get("bankAccountNumber") ?? "") || null,
      musicUrl: String(data.get("musicUrl") ?? "") || null,
    });
  }

  return (
    <div className="gutter grid gap-8 pb-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
      <div className="grid gap-4">
        <PhotoSlot slot="cover" label="Foto sampul" />
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoSlot slot="photo2" label="Foto 2" />
          <PhotoSlot slot="photo3" label="Foto 3" />
        </div>
      <form
        action={action}
        className="grid gap-4"
        onInput={(event) => sync(event.currentTarget)}
      >
        <Field label="URL sampul">
          <Input name="invitationCoverUrl" defaultValue={wedding.invitationCoverUrl ?? ""} placeholder="https://…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL foto 2">
            <Input name="invitationPhoto2" defaultValue={wedding.invitationPhoto2 ?? ""} />
          </Field>
          <Field label="URL foto 3">
            <Input name="invitationPhoto3" defaultValue={wedding.invitationPhoto3 ?? ""} />
          </Field>
        </div>
        <Field label="Kata pengantar">
          <Textarea name="invitationStory" defaultValue={wedding.invitationStory ?? ""} rows={5} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jam akad">
            <Input name="ceremonyTime" placeholder="09:00" defaultValue={wedding.ceremonyTime ?? ""} />
          </Field>
          <Field label="Tempat akad">
            <Input name="ceremonyVenue" defaultValue={wedding.ceremonyVenue ?? wedding.location} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jam resepsi">
            <Input name="receptionTime" placeholder="11:00" defaultValue={wedding.receptionTime ?? ""} />
          </Field>
          <Field label="Tempat resepsi">
            <Input name="receptionVenue" defaultValue={wedding.receptionVenue ?? wedding.location} />
          </Field>
        </div>
        <Field label="Link maps">
          <Input name="mapsUrl" placeholder="https://maps.google.com/..." defaultValue={wedding.mapsUrl ?? ""} />
        </Field>
        <Field label="Dress code">
          <Input name="dressCode" defaultValue={wedding.dressCode ?? ""} />
        </Field>
        <Field label="Musik (URL audio opsional)">
          <Input name="musicUrl" defaultValue={wedding.musicUrl ?? ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank">
            <Input name="bankName" defaultValue={wedding.bankName ?? ""} />
          </Field>
          <Field label="Nama rekening">
            <Input name="bankAccountName" defaultValue={wedding.bankAccountName ?? ""} />
          </Field>
          <Field label="Nomor rekening">
            <Input name="bankAccountNumber" defaultValue={wedding.bankAccountNumber ?? ""} />
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">
          Tautan tamu: <span className="break-all font-medium text-foreground">{publicUrl}</span>
        </p>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-tone-fern">{state.message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Simpan undangan</Button>
          <a href={publicUrl} target="_blank" className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-medium">
            Buka seperti tamu
          </a>
          <a href={whatsappHref(null, shareText)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-medium">
            Bagikan WA
          </a>
        </div>
      </form>
      </div>
      <div className="lg:sticky lg:top-6">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground">PRATINJAU LIVE</p>
        <InvitationView wedding={preview} guestName="Andi Wijaya" compact />
      </div>
    </div>
  );
}

function PhotoSlot({ slot, label }: { slot: string; label: string }) {
  return (
    <form
      action={async (formData) => {
        await uploadInvitationPhoto(formData);
      }}
      className="grid gap-2"
    >
      <Field label={`${label} (unggah)`}>
        <Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="h-10" />
      </Field>
      <input type="hidden" name="slot" value={slot} />
      <Button type="submit" size="sm" variant="secondary">
        Unggah {label.toLowerCase()}
      </Button>
    </form>
  );
}
