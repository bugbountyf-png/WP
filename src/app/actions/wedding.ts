"use server";

import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appUrl, getCurrentUser } from "@/lib/auth";
import { requireWedding } from "@/lib/session";
import { buildChecklist, DOWRY_TASK_TITLES, KUA_TASK_TITLES, SIPIL_TASK_TITLES } from "@/lib/checklist";
import { parseMoney, uniqueInviteSlug } from "@/lib/utils";

const weddingFields = z.object({
  partnerAName: z.string().trim().min(1, "Isi nama kamu."),
  partnerBName: z.string().trim().min(1, "Isi nama pasangan."),
  weddingDate: z.string().min(1, "Pilih tanggalnya."),
  location: z.string().trim().min(1, "Isi lokasinya."),
  estimatedGuests: z.coerce.number().int().min(1).max(100000),
  weddingType: z.enum(["PRIVATE", "OPEN"]),
  marriageTrack: z.enum(["KUA", "CATATAN_SIPIL"]),
  totalBudget: z.coerce.number().int().min(0),
});

export async function onboardingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.ownedWedding || user.partnerWedding) redirect("/app");

  const parsed = weddingFields
    .extend({
      currentSavings: z.coerce.number().int().min(0),
      starterPack: z.enum(["yes", "no"]),
    })
    .safeParse({
      partnerAName: formData.get("partnerAName"),
      partnerBName: formData.get("partnerBName"),
      weddingDate: formData.get("weddingDate"),
      location: formData.get("location"),
      estimatedGuests: formData.get("estimatedGuests"),
      weddingType: formData.get("weddingType"),
      marriageTrack: formData.get("marriageTrack"),
      totalBudget: parseMoney(formData.get("totalBudget")),
      currentSavings: parseMoney(formData.get("currentSavings")),
      starterPack: formData.get("starterPack") ?? "yes",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Cek isiannya, ya." };

  const weddingDate = new Date(`${parsed.data.weddingDate}T00:00:00.000Z`);
  const wedding = await prisma.wedding.create({
    data: {
      ownerId: user.id,
      partnerAName: parsed.data.partnerAName,
      partnerBName: parsed.data.partnerBName,
      weddingDate,
      location: parsed.data.location,
      estimatedGuests: parsed.data.estimatedGuests,
      weddingType: parsed.data.weddingType,
      marriageTrack: parsed.data.marriageTrack,
      totalBudget: parsed.data.totalBudget,
      invitationSlug: uniqueInviteSlug(parsed.data.partnerAName, parsed.data.partnerBName),
      invitationTheme: "linen",
      invitationStory: `Dengan penuh rasa syukur, ${parsed.data.partnerAName} dan ${parsed.data.partnerBName} mengundang kamu hadir di hari bahagia kami.`,
      ceremonyVenue: parsed.data.location,
      receptionVenue: parsed.data.location,
    },
  });

  if (parsed.data.currentSavings > 0) {
    await prisma.savingsEntry.create({
      data: {
        weddingId: wedding.id,
        amount: parsed.data.currentSavings,
        occurredOn: new Date(),
        note: "Saldo awal",
      },
    });
  }

  if (parsed.data.starterPack === "yes") {
    const tasks = buildChecklist({
      weddingDate,
      marriageTrack: parsed.data.marriageTrack,
      weddingType: parsed.data.weddingType,
    });
    await prisma.task.createMany({
      data: tasks.map((task) => ({ ...task, weddingId: wedding.id })),
    });
  }

  redirect("/app");
}

export async function updateWeddingAction(formData: FormData) {
  const { wedding } = await requireWedding();
  const parsed = weddingFields.safeParse({
    partnerAName: formData.get("partnerAName"),
    partnerBName: formData.get("partnerBName"),
    weddingDate: formData.get("weddingDate"),
    location: formData.get("location"),
    estimatedGuests: formData.get("estimatedGuests"),
    weddingType: formData.get("weddingType"),
    marriageTrack: formData.get("marriageTrack"),
    totalBudget: parseMoney(formData.get("totalBudget")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Cek isiannya, ya." };
  const nextDate = new Date(`${parsed.data.weddingDate}T00:00:00.000Z`);
  const trackChanged = wedding.marriageTrack !== parsed.data.marriageTrack;
  await prisma.wedding.update({
    where: { id: wedding.id },
    data: {
      ...parsed.data,
      weddingDate: nextDate,
    },
  });
  if (trackChanged) {
    const remove = parsed.data.marriageTrack === "KUA" ? SIPIL_TASK_TITLES : [...KUA_TASK_TITLES, ...DOWRY_TASK_TITLES];
    await prisma.task.deleteMany({
      where: { weddingId: wedding.id, completed: false, title: { in: remove } },
    });
    const existing = await prisma.task.findMany({ where: { weddingId: wedding.id }, select: { title: true } });
    const have = new Set(existing.map((row) => row.title));
    const extra = buildChecklist({
      weddingDate: nextDate,
      marriageTrack: parsed.data.marriageTrack,
      weddingType: parsed.data.weddingType,
    }).filter((task) => !have.has(task.title));
    if (extra.length) {
      await prisma.task.createMany({ data: extra.map((task) => ({ ...task, weddingId: wedding.id })) });
    }
  }
  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/checklist");
  revalidatePath("/app/calendar");
  revalidatePath("/app/budget");
  return { message: "Detail pernikahan sudah disimpan." };
}

export async function updateLoveNoteAction(formData: FormData) {
  const { user, wedding } = await requireWedding();
  const text = String(formData.get("text") ?? "").trim().slice(0, 140);
  const effect = String(formData.get("effect") ?? "NONE");
  const by = wedding.ownerId === user.id ? "PARTNER_A" : "PARTNER_B";
  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { loveNote: text || null, loveNoteEffect: effect, loveNoteBy: text ? by : null },
  });
  revalidatePath("/app");
}

export async function updateInvitationAction(formData: FormData) {
  const { wedding } = await requireWedding();
  await prisma.wedding.update({
    where: { id: wedding.id },
    data: {
      invitationTheme: "linen",
      invitationStory: String(formData.get("invitationStory") ?? "").trim() || null,
      invitationCoverUrl: String(formData.get("invitationCoverUrl") ?? "").trim() || null,
      invitationPhoto2: String(formData.get("invitationPhoto2") ?? "").trim() || null,
      invitationPhoto3: String(formData.get("invitationPhoto3") ?? "").trim() || null,
      ceremonyTime: String(formData.get("ceremonyTime") ?? "").trim() || null,
      ceremonyVenue: String(formData.get("ceremonyVenue") ?? "").trim() || null,
      receptionTime: String(formData.get("receptionTime") ?? "").trim() || null,
      receptionVenue: String(formData.get("receptionVenue") ?? "").trim() || null,
      mapsUrl: String(formData.get("mapsUrl") ?? "").trim() || null,
      dressCode: String(formData.get("dressCode") ?? "").trim() || null,
      bankName: String(formData.get("bankName") ?? "").trim() || null,
      bankAccountName: String(formData.get("bankAccountName") ?? "").trim() || null,
      bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim() || null,
      musicUrl: String(formData.get("musicUrl") ?? "").trim() || null,
    },
  });
  revalidatePath("/app/undangan");
  revalidatePath(`/i/${wedding.invitationSlug}`);
  return { message: "Undangannya sudah disimpan. Pratinjau di kanan mengikuti isian yang tersimpan." };
}

export async function uploadInvitationPhoto(formData: FormData): Promise<{ error?: string; message?: string }> {
  const { wedding } = await requireWedding();
  const file = formData.get("photo");
  const slot = String(formData.get("slot") ?? "cover");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih fotonya dulu." };
  if (file.size > 4_500_000) return { error: "Maksimal 4,5 MB." };
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return { error: "Pakai JPG, PNG, atau WebP." };
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${wedding.id}-${slot}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/${filename}?v=${Date.now()}`;
  const field =
    slot === "photo2" ? "invitationPhoto2" : slot === "photo3" ? "invitationPhoto3" : "invitationCoverUrl";
  await prisma.wedding.update({ where: { id: wedding.id }, data: { [field]: url } });
  revalidatePath("/app/undangan");
  revalidatePath(`/i/${wedding.invitationSlug}`);
  return { message: "Foto tersimpan." };
}

export async function invitePartnerAction(formData: FormData) {
  const { wedding } = await requireWedding();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Isi email pasangan yang benar, ya." };
  const token = crypto.randomBytes(18).toString("hex");
  await prisma.partnerInvite.create({
    data: {
      token,
      weddingId: wedding.id,
      email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });
  return {
    message: "Tautan undangan pasangan sudah siap. Kirim ke dia, atau buka sendiri untuk tes di localhost.",
    link: `${appUrl()}/invite/${token}`,
  };
}

export async function acceptInviteAction(token: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);
  const invite = await prisma.partnerInvite.findUnique({ where: { token }, include: { wedding: true } });
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    redirect("/invite/expired");
  }
  if (user.ownedWedding || user.partnerWedding) {
    redirect("/app");
  }
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    redirect(`/invite/${token}?error=email`);
  }
  await prisma.$transaction([
    prisma.wedding.update({
      where: { id: invite.weddingId },
      data: { partnerId: user.id },
    }),
    prisma.partnerInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  redirect("/app");
}
