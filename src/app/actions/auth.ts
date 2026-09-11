"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
  appUrl,
} from "@/lib/auth";
import { safeNextPath, isLocalApp } from "@/lib/safe-path";
import crypto from "crypto";

const emailSchema = z.string().trim().email("Format emailnya belum benar.");
const passwordSchema = z.string().min(8, "Minimal 8 karakter, ya.");

export async function registerAction(formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Isi dulu namamu, ya."),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Cek isiannya, ya." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return { error: "Email ini sudah terdaftar. Masuk aja." };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await createSession(user.id);
  const next = safeNextPath(String(formData.get("next") || ""), "/onboarding");
  if (next.startsWith("/invite/")) redirect(next);
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Isi dulu passwordnya, ya.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Cek isiannya, ya." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email atau passwordnya belum cocok." };
  }
  await createSession(user.id);
  redirect(safeNextPath(String(formData.get("next") || "/app")));
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Emailnya belum benar." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.toLowerCase() } });
  if (!user) {
    return {
      message: isLocalApp()
        ? "Kalau emailnya terdaftar, tautan resetnya sudah siap. Cek lagi di layar ini pada mode lokal."
        : "Kalau emailnya terdaftar, permintaan reset sudah dicatat. Pengiriman email belum aktif di server ini — setelah berhasil masuk, ganti password dari Pengaturan.",
    };
  }

  const token = crypto.randomBytes(24).toString("hex");
  await prisma.passwordReset.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });
  const link = `${appUrl()}/reset-password?token=${token}`;
  if (isLocalApp()) {
    return {
      message: "Tautan reset sudah dibuat. Di localhost kami tampilkan langsung karena email belum dikonfigurasi.",
      link,
    };
  }
  return {
    message:
      "Kalau emailnya terdaftar, permintaan reset sudah dicatat. Pengiriman email belum aktif di server ini — setelah berhasil masuk, ganti password dari Pengaturan.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = z
    .object({
      token: z.string().min(10),
      password: passwordSchema,
    })
    .safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { error: "Password baru minimal 8 karakter." };

  const row = await prisma.passwordReset.findUnique({ where: { token: parsed.data.token } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { error: "Tautan resetnya sudah tidak berlaku. Minta yang baru, ya." };
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  await createSession(row.userId);
  redirect("/app");
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu, ya." };
  const parsed = z
    .object({
      currentPassword: z.string().min(1, "Isi dulu password lama kamu, ya."),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(1),
    })
    .refine((v) => v.newPassword === v.confirmPassword, { message: "Ulangannya beda sama password baru.", path: ["confirmPassword"] })
    .refine((v) => v.newPassword !== v.currentPassword, { message: "Password barunya masih sama kayak yang lama." })
    .safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Cek isiannya, ya." };
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Password lamanya belum cocok." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return { message: "Password sudah diganti." };
}
