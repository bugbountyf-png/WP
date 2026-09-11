"use client";

import { useActionState, useState } from "react";
import { publicRsvp } from "@/app/actions/data";
import { Button, Field, Input, Select } from "@/components/ui";
import { MEAL_LABELS, MEAL_PREFERENCES } from "@/lib/labels";
import { emptyActionState, wrapAction } from "@/lib/form-state";

export function RsvpForm({
  slug,
  guestName,
  token,
}: {
  slug: string;
  guestName?: string | null;
  token?: string | null;
}) {
  const [state, action] = useActionState(wrapAction(publicRsvp.bind(null, slug)), emptyActionState);
  const [attending, setAttending] = useState("yes");
  if (state.message) {
    return <p className="rounded-xl bg-white/80 p-4 text-sm text-[#2c241c]">{state.message}</p>;
  }
  return (
    <form action={action} className="grid gap-3 rounded-xl bg-white/80 p-4 text-left text-[#2c241c]">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      <h2 className="font-medium">Konfirmasi kehadiran</h2>
      <Field label="Nama">
        <Input name="name" required defaultValue={guestName ?? ""} />
      </Field>
      <Field label="Kehadiran">
        <Select name="attending" defaultValue="yes" onChange={(e) => setAttending(e.target.value)}>
          <option value="yes">Hadir</option>
          <option value="no">Tidak bisa hadir</option>
        </Select>
      </Field>
      {attending === "yes" ? (
        <>
          <Field label="Jumlah orang">
            <Input type="number" name="pax" min={1} defaultValue={1} />
          </Field>
          <Field label="Nama plus-one (opsional)">
            <Input name="plusOneName" />
          </Field>
          <Field label="Menu">
            <Select name="mealPreference" defaultValue="STANDARD">
              {MEAL_PREFERENCES.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alergi">
            <Input name="allergy" />
          </Field>
        </>
      ) : null}
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <Button type="submit">Kirim RSVP</Button>
    </form>
  );
}
