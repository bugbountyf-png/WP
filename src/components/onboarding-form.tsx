"use client";

import { useActionState } from "react";
import { onboardingAction } from "@/app/actions/wedding";
import { Logo } from "@/components/logo";
import { Button, Field, Input, Select } from "@/components/ui";
import { emptyActionState, wrapAction } from "@/lib/form-state";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState(wrapAction(onboardingAction), emptyActionState);
  return (
    <div className="gutter mx-auto max-w-xl py-10">
      <Logo href="/" />
      <h1 className="display mt-10 text-3xl">Siapkan pernikahan kamu</h1>
      <p className="mt-3 text-sm text-muted-foreground">Beberapa pertanyaan aja. Jawabannya yang nentuin isi checklist awal kamu — tenggatnya disebar sesuai jarak ke hari-H, tidak ditumpuk seminggu ke depan.</p>
      <form action={action} className="mt-8 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama kamu">
            <Input name="partnerAName" defaultValue={defaultName} required />
          </Field>
          <Field label="Nama pasangan">
            <Input name="partnerBName" required />
          </Field>
        </div>
        <Field label="Tanggal nikah">
          <Input type="date" name="weddingDate" required />
        </Field>
        <Field label="Lokasi">
          <Input name="location" placeholder="Nama venue atau kota" required />
        </Field>
        <Field label="Perkiraan jumlah tamu">
          <Input type="number" name="estimatedGuests" min={1} defaultValue={100} required />
        </Field>
        <Field label="Jenis acara">
          <Select name="weddingType" defaultValue="PRIVATE">
            <option value="PRIVATE">Tertutup</option>
            <option value="OPEN">Terbuka</option>
          </Select>
        </Field>
        <Field label="Jalur pencatatan" hint="KUA untuk pernikahan Islam (N1–N4, Simkah). Catatan Sipil untuk dukcapil.">
          <Select name="marriageTrack" defaultValue="KUA">
            <option value="KUA">KUA</option>
            <option value="CATATAN_SIPIL">Catatan Sipil</option>
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Total budget (Rp)">
            <Input name="totalBudget" inputMode="numeric" placeholder="250000000" />
          </Field>
          <Field label="Tabungan saat ini (Rp)">
            <Input name="currentSavings" inputMode="numeric" placeholder="0" />
          </Field>
        </div>
        <Field label="Mau kami bantu susun checklist-nya?">
          <Select name="starterPack" defaultValue="yes">
            <option value="yes">Bantu susunkan — checklist menyesuaikan tanggal dan jalur nikah</option>
            <option value="no">Atur sendiri dari nol</option>
          </Select>
        </Field>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit">Mulai rencanakan</Button>
      </form>
    </div>
  );
}
