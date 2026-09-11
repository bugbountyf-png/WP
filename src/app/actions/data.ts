"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";
import { parseCsv } from "@/lib/csv";
import { parseMoney } from "@/lib/utils";
import { applyPaidPayment, reconcileVendorMoney } from "@/lib/vendor-money";
import { withPlusOnePax } from "@/lib/guests";

function guestToken() {
  return crypto.randomBytes(8).toString("hex");
}

function mapGuestSide(raw: string, partnerAName: string, partnerBName: string) {
  const value = raw.trim().toLowerCase();
  if (["b", "partner_b", "istri", "wanita", partnerBName.toLowerCase()].includes(value)) return "PARTNER_B";
  return "PARTNER_A";
}

function mapGuestGroup(raw: string) {
  const value = raw.trim().toUpperCase();
  if (["FAMILY", "FRIEND", "WORK", "OTHER"].includes(value)) return value;
  if (["keluarga"].includes(raw.trim().toLowerCase())) return "FAMILY";
  if (["teman"].includes(raw.trim().toLowerCase())) return "FRIEND";
  if (["kantor", "kerja"].includes(raw.trim().toLowerCase())) return "WORK";
  return "OTHER";
}

function mapMeal(raw: string) {
  const value = raw.trim().toUpperCase();
  if (["STANDARD", "VEGETARIAN", "CHILD", "OTHER"].includes(value)) return value;
  if (raw.toLowerCase().includes("veg")) return "VEGETARIAN";
  if (raw.toLowerCase().includes("anak")) return "CHILD";
  return "STANDARD";
}

function dateOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw ? new Date(`${raw}T00:00:00.000Z`) : null;
}

function dateRequired(value: FormDataEntryValue | null) {
  return new Date(`${String(value)}T00:00:00.000Z`);
}

async function touch(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function createTask(formData: FormData) {
  const { wedding } = await requireWedding();
  await prisma.task.create({
    data: {
      weddingId: wedding.id,
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "OTHER"),
      dueDate: dateOrNull(formData.get("dueDate")),
      priority: String(formData.get("priority") ?? "MEDIUM"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await touch(["/app/checklist", "/app", "/app/calendar"]);
}

export async function toggleTask(id: string, completed: boolean) {
  const { wedding } = await requireWedding();
  await prisma.task.updateMany({
    where: { id, weddingId: wedding.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  await touch(["/app/checklist", "/app", "/app/calendar"]);
}

export async function updateTask(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.task.updateMany({
    where: { id, weddingId: wedding.id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? "OTHER"),
      priority: String(formData.get("priority") ?? "MEDIUM"),
      dueDate: dateOrNull(formData.get("dueDate")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await touch(["/app/checklist", "/app", "/app/calendar"]);
}

export async function deleteTask(id: string): Promise<void> {
  const { wedding } = await requireWedding();
  await prisma.task.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/checklist", "/app", "/app/calendar"]);
}

export async function createBudgetItem(formData: FormData) {
  const { wedding } = await requireWedding();
  const estimated = parseMoney(formData.get("estimatedCost"));
  const actual = parseMoney(formData.get("actualCost"));
  const paid = parseMoney(formData.get("paidAmount"));
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  await prisma.budgetItem.create({
    data: {
      weddingId: wedding.id,
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "OTHER"),
      estimatedCost: estimated,
      actualCost: actual,
      paidAmount: paid,
      vendorId,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  if (vendorId) await reconcileVendorMoney(wedding.id, vendorId);
  await touch(["/app/budget", "/app", "/app/vendors", "/app/calendar"]);
}

export async function updateBudgetItem(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  await prisma.budgetItem.updateMany({
    where: { id, weddingId: wedding.id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "OTHER"),
      estimatedCost: parseMoney(formData.get("estimatedCost")),
      actualCost: parseMoney(formData.get("actualCost")),
      paidAmount: parseMoney(formData.get("paidAmount")),
      vendorId,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  if (vendorId) await reconcileVendorMoney(wedding.id, vendorId);
  await touch(["/app/budget", "/app", "/app/vendors", "/app/calendar"]);
}

export async function deleteBudgetItem(id: string) {
  const { wedding } = await requireWedding();
  await prisma.budgetItem.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/budget", "/app"]);
}

export async function updatePlafon(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { totalBudget: parseMoney(formData.get("totalBudget")) },
  });
  await touch(["/app/budget", "/app", "/app/settings"]);
}

export async function createPayment(formData: FormData) {
  const { wedding } = await requireWedding();
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  await prisma.payment.create({
    data: {
      weddingId: wedding.id,
      vendorId,
      title: String(formData.get("title") ?? "").trim(),
      amount: parseMoney(formData.get("amount")),
      dueDate: dateRequired(formData.get("dueDate")),
      paidDate: dateOrNull(formData.get("paidDate")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  if (vendorId) await reconcileVendorMoney(wedding.id, vendorId);
  await touch(["/app/budget", "/app/calendar", "/app", "/app/vendors"]);
}

export async function updatePayment(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  await prisma.payment.updateMany({
    where: { id, weddingId: wedding.id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      amount: parseMoney(formData.get("amount")),
      dueDate: dateRequired(formData.get("dueDate")),
      vendorId,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  if (vendorId) await reconcileVendorMoney(wedding.id, vendorId);
  await touch(["/app/budget", "/app/calendar", "/app", "/app/vendors"]);
}

export async function markPaymentPaid(id: string) {
  const { wedding } = await requireWedding();
  await applyPaidPayment(wedding.id, id);
  await touch(["/app/budget", "/app/calendar", "/app", "/app/vendors"]);
}

export async function deletePayment(id: string) {
  const { wedding } = await requireWedding();
  const row = await prisma.payment.findFirst({ where: { id, weddingId: wedding.id } });
  await prisma.payment.deleteMany({ where: { id, weddingId: wedding.id } });
  if (row?.vendorId) await reconcileVendorMoney(wedding.id, row.vendorId);
  await touch(["/app/budget", "/app/calendar", "/app", "/app/vendors"]);
}

async function maybeLinkVendorBudget(input: {
  weddingId: string;
  vendorId: string;
  name: string;
  category: string;
  price: number;
  deposit: number;
  status: string;
  recordBudget: boolean;
}) {
  if (!input.recordBudget || input.price <= 0) return;
  if (!["BOOKED", "PAID", "NEGOTIATING"].includes(input.status)) return;
  const existing = await prisma.budgetItem.findFirst({
    where: { weddingId: input.weddingId, vendorId: input.vendorId },
  });
  if (existing) {
    await prisma.budgetItem.update({
      where: { id: existing.id },
      data: { estimatedCost: input.price, paidAmount: input.deposit || existing.paidAmount },
    });
    return;
  }
  await prisma.budgetItem.create({
    data: {
      weddingId: input.weddingId,
      vendorId: input.vendorId,
      name: input.name,
      category: input.category,
      estimatedCost: input.price,
      actualCost: input.price,
      paidAmount: input.deposit,
    },
  });
}

export async function createVendor(formData: FormData) {
  const { wedding } = await requireWedding();
  const status = String(formData.get("status") ?? "RESEARCHING");
  const price = parseMoney(formData.get("price"));
  const deposit = parseMoney(formData.get("deposit"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER");
  const vendor = await prisma.vendor.create({
    data: {
      weddingId: wedding.id,
      name,
      category,
      contactName: String(formData.get("contactName") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      rating: Number(formData.get("rating") ?? 0) || 0,
      price,
      deposit,
      status,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await maybeLinkVendorBudget({
    weddingId: wedding.id,
    vendorId: vendor.id,
    name,
    category,
    price,
    deposit,
    status,
    recordBudget: String(formData.get("recordBudget") ?? "") === "yes" || ["BOOKED", "PAID"].includes(status),
  });
  if (["BOOKED", "PAID", "NEGOTIATING"].includes(status) && price > 0) {
    await reconcileVendorMoney(wedding.id, vendor.id);
  }
  await touch(["/app/vendors", "/app/budget", "/app", "/app/calendar"]);
}

export async function updateVendor(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const status = String(formData.get("status") ?? "RESEARCHING");
  const price = parseMoney(formData.get("price"));
  const deposit = parseMoney(formData.get("deposit"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER");
  await prisma.vendor.updateMany({
    where: { id, weddingId: wedding.id },
    data: {
      name,
      category,
      status,
      price,
      deposit,
      location: String(formData.get("location") ?? "").trim() || null,
      rating: Number(formData.get("rating") ?? 0) || 0,
      contactName: String(formData.get("contactName") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await maybeLinkVendorBudget({
    weddingId: wedding.id,
    vendorId: id,
    name,
    category,
    price,
    deposit,
    status,
    recordBudget: String(formData.get("recordBudget") ?? "") === "yes" || ["BOOKED", "PAID"].includes(status),
  });
  if (["BOOKED", "PAID", "NEGOTIATING"].includes(status) && price > 0) {
    await reconcileVendorMoney(wedding.id, id);
  }
  await touch(["/app/vendors", "/app/budget", "/app", "/app/calendar"]);
}

export async function deleteVendor(id: string) {
  const { wedding } = await requireWedding();
  await prisma.vendor.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/vendors", "/app", "/app/budget"]);
}

export async function promoteResearch(id: string): Promise<void> {
  const { wedding } = await requireWedding();
  const row = await prisma.research.findFirst({ where: { id, weddingId: wedding.id } });
  if (!row) return;
  await prisma.vendor.create({
    data: {
      weddingId: wedding.id,
      name: row.name,
      category: row.category,
      location: row.location,
      price: row.price,
      rating: row.rating,
      notes: row.notes,
      status: "RESEARCHING",
    },
  });
  await prisma.research.delete({ where: { id: row.id } });
  await touch(["/app/vendors"]);
}

export async function createResearch(formData: FormData) {
  formData.set("status", "RESEARCHING");
  await createVendor(formData);
}

export async function deleteResearch(id: string) {
  const { wedding } = await requireWedding();
  await prisma.research.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/vendors"]);
}

function guestFields(formData: FormData, partnerAName: string, partnerBName: string) {
  const plusOneAllowed = String(formData.get("plusOneAllowed") ?? "") === "yes";
  return {
    name: String(formData.get("name") ?? "").trim(),
    side: mapGuestSide(String(formData.get("side") ?? "PARTNER_A"), partnerAName, partnerBName),
    groupName: mapGuestGroup(String(formData.get("groupName") ?? "FAMILY")),
    phone: String(formData.get("phone") ?? "").trim() || null,
    pax: withPlusOnePax(Math.max(1, Number(formData.get("pax") ?? 1) || 1), plusOneAllowed, String(formData.get("plusOneName") ?? "").trim() || null),
    plusOneAllowed,
    plusOneName: String(formData.get("plusOneName") ?? "").trim() || null,
    mealPreference: mapMeal(String(formData.get("mealPreference") ?? "STANDARD")),
    allergy: String(formData.get("allergy") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    household: String(formData.get("household") ?? "").trim() || null,
    tableNumber: String(formData.get("tableNumber") ?? "").trim() || null,
    invitationStatus: String(formData.get("invitationStatus") ?? "NOT_INVITED"),
    rsvpStatus: String(formData.get("rsvpStatus") ?? "PENDING"),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createGuest(formData: FormData) {
  const { wedding } = await requireWedding();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.guest.create({
    data: {
      weddingId: wedding.id,
      inviteToken: guestToken(),
      ...guestFields(formData, wedding.partnerAName, wedding.partnerBName),
    },
  });
  await touch(["/app/guests", "/app"]);
}

export async function updateGuest(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.guest.updateMany({
    where: { id, weddingId: wedding.id },
    data: guestFields(formData, wedding.partnerAName, wedding.partnerBName),
  });
  await touch(["/app/guests", "/app"]);
}

export async function markGuestInvited(id: string): Promise<void> {
  const { wedding } = await requireWedding();
  await prisma.guest.updateMany({
    where: { id, weddingId: wedding.id },
    data: { invitationStatus: "INVITED" },
  });
  await touch(["/app/guests"]);
}

export async function deleteGuest(id: string) {
  const { wedding } = await requireWedding();
  await prisma.guest.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/guests", "/app"]);
}

export async function importGuests(formData: FormData): Promise<{ message?: string; error?: string }> {
  const { wedding } = await requireWedding();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file CSV-nya dulu." };
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return { error: "CSV-nya kosong atau header-nya tidak kebaca." };
  let created = 0;
  for (const row of rows) {
    const name = (row.nama || row.name || "").trim();
    if (!name) continue;
    await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        inviteToken: guestToken(),
        name,
        side: mapGuestSide(row.sisi || row.side || "A", wedding.partnerAName, wedding.partnerBName),
        groupName: mapGuestGroup(row.kelompok || row.group || "FAMILY"),
        phone: (row.telepon || row.phone || "").trim() || null,
        pax: withPlusOnePax(
          Math.max(1, Number(row.pax || row.jumlah || 1) || 1),
          ["true", "1", "yes", "ya"].includes((row.plus_one || row.plusone || "").toLowerCase()),
          (row.nama_plus_one || "").trim() || null,
        ),
        plusOneAllowed: ["true", "1", "yes", "ya"].includes((row.plus_one || row.plusone || "").toLowerCase()),
        plusOneName: (row.nama_plus_one || "").trim() || null,
        mealPreference: mapMeal(row.menu || row.meal || "STANDARD"),
        allergy: (row.alergi || row.allergy || "").trim() || null,
        address: (row.alamat || row.address || "").trim() || null,
        household: (row.rumah_tangga || row.household || "").trim() || null,
        tableNumber: (row.meja || row.table || "").trim() || null,
      },
    });
    created += 1;
  }
  await touch(["/app/guests", "/app"]);
  return { message: `${created} tamu masuk dari CSV.` };
}

export async function assignGuestTable(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.guest.updateMany({
    where: { id, weddingId: wedding.id },
    data: { tableNumber: String(formData.get("tableNumber") ?? "").trim() || null },
  });
  await touch(["/app/guests"]);
}

export async function createTimeline(formData: FormData) {
  const { wedding } = await requireWedding();
  const count = await prisma.timelineEvent.count({ where: { weddingId: wedding.id } });
  await prisma.timelineEvent.create({
    data: {
      weddingId: wedding.id,
      time: String(formData.get("time") ?? "08:00"),
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      pic: String(formData.get("pic") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      sortOrder: count,
    },
  });
  await touch(["/app/timeline"]);
}

export async function deleteTimeline(id: string) {
  const { wedding } = await requireWedding();
  await prisma.timelineEvent.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/timeline"]);
}

export async function createSong(formData: FormData) {
  const { wedding } = await requireWedding();
  await prisma.song.create({
    data: {
      weddingId: wedding.id,
      title: String(formData.get("title") ?? "").trim(),
      artist: String(formData.get("artist") ?? "").trim() || null,
      moment: String(formData.get("moment") ?? "OTHER"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await touch(["/app/timeline"]);
}

export async function deleteSong(id: string) {
  const { wedding } = await requireWedding();
  await prisma.song.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/timeline"]);
}

export async function createReminder(formData: FormData) {
  const { wedding } = await requireWedding();
  await prisma.reminder.create({
    data: {
      weddingId: wedding.id,
      title: String(formData.get("title") ?? "").trim(),
      date: dateRequired(formData.get("date")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await touch(["/app/calendar"]);
}

export async function deleteReminder(id: string) {
  const { wedding } = await requireWedding();
  await prisma.reminder.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/calendar"]);
}

export async function createSavings(formData: FormData) {
  const { wedding } = await requireWedding();
  const kind = String(formData.get("kind") ?? "DEPOSIT");
  const amount = parseMoney(formData.get("amount"));
  await prisma.savingsEntry.create({
    data: {
      weddingId: wedding.id,
      amount: kind === "WITHDRAWAL" ? -Math.abs(amount) : Math.abs(amount),
      occurredOn: dateRequired(formData.get("occurredOn")),
      side: String(formData.get("side") ?? "") || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  await touch(["/app/budget", "/app"]);
}

export async function updateSavings(formData: FormData): Promise<void> {
  const { wedding } = await requireWedding();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const kind = String(formData.get("kind") ?? "DEPOSIT");
  const amount = parseMoney(formData.get("amount"));
  await prisma.savingsEntry.updateMany({
    where: { id, weddingId: wedding.id },
    data: {
      amount: kind === "WITHDRAWAL" ? -Math.abs(amount) : Math.abs(amount),
      occurredOn: dateRequired(formData.get("occurredOn")),
      side: String(formData.get("side") ?? "") || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  await touch(["/app/budget", "/app"]);
}

export async function deleteSavings(id: string) {
  const { wedding } = await requireWedding();
  await prisma.savingsEntry.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/budget", "/app"]);
}

export async function createSeserahan(formData: FormData) {
  const { wedding } = await requireWedding();
  await prisma.seserahanItem.create({
    data: {
      weddingId: wedding.id,
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "OTHER"),
      estimatedCost: parseMoney(formData.get("estimatedCost")),
      actualCost: parseMoney(formData.get("actualCost")),
      buyer: String(formData.get("buyer") ?? "").trim() || null,
      status: String(formData.get("status") ?? "PENDING"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await touch(["/app/seserahan", "/app/budget", "/app"]);
}

export async function deleteSeserahan(id: string) {
  const { wedding } = await requireWedding();
  await prisma.seserahanItem.deleteMany({ where: { id, weddingId: wedding.id } });
  await touch(["/app/seserahan", "/app/budget", "/app"]);
}

export async function publicRsvp(slug: string, formData: FormData) {
  const wedding = await prisma.wedding.findUnique({ where: { invitationSlug: slug } });
  if (!wedding) return { error: "Undangan tidak ditemukan." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Isi namamu, ya." };
  const attending = String(formData.get("attending") ?? "yes");
  const pax = Math.max(1, Number(formData.get("pax") ?? 1) || 1);
  const token = String(formData.get("token") ?? "").trim();
  const mealPreference = mapMeal(String(formData.get("mealPreference") ?? "STANDARD"));
  const allergy = String(formData.get("allergy") ?? "").trim() || null;
  const plusOneName = String(formData.get("plusOneName") ?? "").trim() || null;
  const existing = token
    ? await prisma.guest.findFirst({ where: { weddingId: wedding.id, inviteToken: token } })
    : await prisma.guest.findFirst({ where: { weddingId: wedding.id, name: { equals: name } } });
  const rsvpStatus = attending === "no" ? "DECLINED" : "CONFIRMED";
  const payload = {
    name,
    rsvpStatus,
    pax: attending === "no" ? 0 : pax,
    invitationStatus: "INVITED" as const,
    mealPreference,
    allergy,
    plusOneName,
  };
  if (existing) {
    await prisma.guest.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        inviteToken: guestToken(),
        groupName: "OTHER",
        notes: "RSVP dari undangan digital",
        ...payload,
      },
    });
  }
  return { message: attending === "no" ? "Kami sudah catat. Terima kasih sudah mengabari." : "Syukurlah. Sampai ketemu di hari-H." };
}
