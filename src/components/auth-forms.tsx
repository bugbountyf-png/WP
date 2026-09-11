"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { loginAction, registerAction, forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import { emptyActionState, wrapAction } from "@/lib/form-state";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(wrapAction(loginAction), emptyActionState);
  return (
    <AuthShell
      title="Selamat datang lagi"
      description="Masuk dan lanjutkan persiapan nikah kamu dari terakhir kali."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Bikin sekarang
          </Link>
        </>
      }
    >
      <form action={action} className="grid gap-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email" error={state.error}>
          <Input type="email" name="email" autoComplete="email" autoFocus required />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" autoComplete="current-password" required />
        </Field>
        <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
          Lupa password?
        </Link>
        {state.error ? (
          <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit">Masuk</Button>
      </form>
    </AuthShell>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(wrapAction(registerAction), emptyActionState);
  return (
    <AuthShell
      title="Siapkan hari besarmu"
      description="Satu tempat buat checklist, budget, vendor, tamu, undangan, dan rundown. Semua fiturnya terbuka."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form action={action} className="grid gap-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Nama kamu">
          <Input name="name" autoComplete="name" autoFocus required />
        </Field>
        <Field label="Email">
          <Input type="email" name="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="Minimal 8 karakter.">
          <Input type="password" name="password" autoComplete="new-password" required minLength={8} />
        </Field>
        {state.error ? (
          <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit">Bikin akun</Button>
      </form>
    </AuthShell>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(wrapAction(forgotPasswordAction), emptyActionState);
  return (
    <AuthShell
      title="Lupa password"
      description="Isi email akunmu. Di localhost tautannya tampil di sini. Di server produksi, ganti password dari Pengaturan setelah masuk."
      footer={
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Kembali masuk
        </Link>
      }
    >
      <form action={action} className="grid gap-5">
        <Field label="Email">
          <Input type="email" name="email" required autoFocus />
        </Field>
        {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state && "message" in state && state.message ? <p className="text-sm text-tone-fern">{state.message}</p> : null}
        {state && "link" in state && state.link ? (
          <a href={state.link} className="break-all text-sm text-primary underline">
            {state.link}
          </a>
        ) : null}
        <Button type="submit">Kirim tautan reset</Button>
      </form>
    </AuthShell>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(wrapAction(resetPasswordAction), emptyActionState);
  return (
    <AuthShell
      title="Password baru"
      description="Minimal 8 karakter. Setelah ini kamu langsung masuk lagi."
      footer={
        <Link href="/login" className="font-medium text-primary">
          Batal
        </Link>
      }
    >
      <form action={action} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <Field label="Password baru">
          <Input type="password" name="password" minLength={8} required autoFocus />
        </Field>
        {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit">Simpan password</Button>
      </form>
    </AuthShell>
  );
}
