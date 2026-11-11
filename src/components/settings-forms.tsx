"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import { invitePartnerAction, updateWeddingAction } from "@/app/actions/wedding";
import { Button, Field, Input, Select } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { emptyActionState, wrapAction } from "@/lib/form-state";

export function WeddingSettingsForm(props: {
  partnerAName: string;
  partnerBName: string;
  weddingDate: Date;
  location: string;
  estimatedGuests: number;
  weddingType: string;
  marriageTrack: string;
  totalBudget: number;
}) {
  const [state, action] = useActionState(wrapAction(updateWeddingAction), emptyActionState);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kamu">
          <Input name="partnerAName" defaultValue={props.partnerAName} required />
        </Field>
        <Field label="Nama pasangan">
          <Input name="partnerBName" defaultValue={props.partnerBName} required />
        </Field>
      </div>
      <Field label="Tanggal" hint="Mengubah tanggal menggeser hitung mundur dan tenggat tugas yang belum selesai. Jadwal bayar vendor tidak ikut pindah.">
        <Input type="date" name="weddingDate" defaultValue={toDateInput(props.weddingDate)} required />
      </Field>
      <Field label="Lokasi">
        <Input name="location" defaultValue={props.location} required />
      </Field>
      <Field label="Perkiraan tamu">
        <Input type="number" name="estimatedGuests" defaultValue={props.estimatedGuests} />
      </Field>
      <Field label="Jenis acara">
        <Select name="weddingType" defaultValue={props.weddingType}>
          <option value="PRIVATE">Tertutup</option>
          <option value="OPEN">Terbuka</option>
        </Select>
      </Field>
      <Field label="Jalur pencatatan">
        <Select name="marriageTrack" defaultValue={props.marriageTrack}>
          <option value="KUA">KUA</option>
          <option value="CATATAN_SIPIL">Catatan Sipil</option>
        </Select>
      </Field>
      <Field label="Total budget">
        <Input name="totalBudget" defaultValue={String(props.totalBudget)} />
      </Field>
      {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "message" in state && state.message ? <p className="text-sm text-tone-fern">{state.message}</p> : null}
      <Button type="submit">Simpan detail</Button>
    </form>
  );
}

export function PartnerInviteForm({ partnerName, partnerEmail }: { partnerName?: string | null; partnerEmail?: string | null }) {
  const [state, action] = useActionState(wrapAction(invitePartnerAction), emptyActionState);
  if (partnerName) {
    return <p className="text-sm">Pasangan sudah gabung: {partnerName} {partnerEmail ? `(${partnerEmail})` : ""}</p>;
  }
  return (
    <form action={action} className="grid gap-3">
      <Field label="Email pasangan">
        <Input type="email" name="email" required />
      </Field>
      {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "message" in state && state.message ? <p className="text-sm text-tone-fern">{state.message}</p> : null}
      {state && "link" in state && state.link ? (
        <a className="break-all text-sm text-primary underline" href={state.link}>
          {state.link}
        </a>
      ) : null}
      <Button type="submit">Buat tautan undangan</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(wrapAction(changePasswordAction), emptyActionState);
  return (
    <form action={action} className="grid gap-3">
      <Field label="Password lama">
        <Input type="password" name="currentPassword" required />
      </Field>
      <Field label="Password baru" hint="Minimal 8 karakter.">
        <Input type="password" name="newPassword" minLength={8} required />
      </Field>
      <Field label="Ulangi password baru">
        <Input type="password" name="confirmPassword" required />
      </Field>
      {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "message" in state && state.message ? <p className="text-sm text-tone-fern">{state.message}</p> : null}
      <Button type="submit">Ganti password</Button>
    </form>
  );
}
