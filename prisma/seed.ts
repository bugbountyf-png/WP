import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildChecklist } from "../src/lib/checklist";

const prisma = new PrismaClient();

function token() {
  return crypto.randomBytes(8).toString("hex");
}

async function main() {
  const email = "demo@buma.local";
  const passwordHash = await bcrypt.hash("Demo@123321", 12);

  await prisma.wedding.deleteMany({ where: { invitationSlug: "budi-dan-irma-demo" } });
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Budi",
      passwordHash,
    },
  });

  const weddingDate = new Date("2027-04-23T00:00:00.000Z");
  const wedding = await prisma.wedding.create({
    data: {
      ownerId: user.id,
      partnerAName: "Budi",
      partnerBName: "Irma",
      weddingDate,
      location: "Sabuga",
      estimatedGuests: 150,
      weddingType: "PRIVATE",
      marriageTrack: "KUA",
      totalBudget: 250_000_000,
      invitationSlug: "budi-dan-irma-demo",
      invitationTheme: "linen",
      invitationStory: "Dengan penuh rasa syukur, Budi dan Irma mengundang kamu hadir di hari bahagia kami.",
      invitationCoverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
      invitationPhoto2: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80",
      invitationPhoto3: "https://images.unsplash.com/photo-1522673607200-164d1b6ce169?auto=format&fit=crop&w=900&q=80",
      ceremonyTime: "09:00",
      ceremonyVenue: "Masjid Salman ITB",
      receptionTime: "11:30",
      receptionVenue: "Sabuga",
      mapsUrl: "https://maps.google.com/?q=Sabuga+ITB",
      dressCode: "Earth tone",
      bankName: "BCA",
      bankAccountName: "Budi Santoso",
      bankAccountNumber: "1234567890",
    },
  });

  await prisma.savingsEntry.create({
    data: {
      weddingId: wedding.id,
      amount: 2_500_000,
      occurredOn: new Date(),
      note: "Saldo awal",
    },
  });

  const tasks = buildChecklist({
    weddingDate,
    marriageTrack: "KUA",
    weddingType: "PRIVATE",
  });
  await prisma.task.createMany({
    data: tasks.map((task) => ({ ...task, weddingId: wedding.id })),
  });

  const wo = await prisma.vendor.create({
    data: {
      weddingId: wedding.id,
      name: "WO Pelita",
      category: "WEDDING_ORGANIZER",
      status: "BOOKED",
      price: 35_000_000,
      deposit: 10_000_000,
      phone: "081211112222",
      location: "Bandung",
      rating: 5,
    },
  });
  await prisma.vendor.create({
    data: {
      weddingId: wedding.id,
      name: "Katering Sari Rasa",
      category: "CATERING",
      status: "RESEARCHING",
      price: 80_000_000,
      location: "Bandung",
      rating: 4,
      notes: "Paket 150 pax, ada opsi vegetarian",
    },
  });
  await prisma.budgetItem.create({
    data: {
      weddingId: wedding.id,
      vendorId: wo.id,
      name: "Wedding organizer",
      category: "WEDDING_ORGANIZER",
      estimatedCost: 35_000_000,
      actualCost: 35_000_000,
      paidAmount: 10_000_000,
    },
  });
  await prisma.payment.create({
    data: {
      weddingId: wedding.id,
      title: "Pelunasan WO Pelita",
      amount: 25_000_000,
      dueDate: new Date("2027-03-23T00:00:00.000Z"),
      vendorId: wo.id,
    },
  });
  await prisma.reminder.create({
    data: {
      weddingId: wedding.id,
      title: "Fitting gaun terakhir",
      date: new Date("2026-09-20T00:00:00.000Z"),
      notes: "Bawa sepatu dan aksesoris",
    },
  });

  await prisma.guest.createMany({
    data: [
      {
        weddingId: wedding.id,
        name: "Andi Wijaya",
        side: "PARTNER_A",
        groupName: "FAMILY",
        phone: "081234567890",
        pax: 2,
        plusOneAllowed: true,
        plusOneName: "Sari Wijaya",
        household: "Keluarga Wijaya",
        address: "Jl. Melati 12, Bandung",
        tableNumber: "1",
        invitationStatus: "INVITED",
        rsvpStatus: "CONFIRMED",
        mealPreference: "STANDARD",
        inviteToken: token(),
      },
      {
        weddingId: wedding.id,
        name: "Sinta",
        side: "PARTNER_B",
        groupName: "FRIEND",
        phone: "081298765432",
        pax: 1,
        plusOneAllowed: false,
        household: "Teman kuliah",
        tableNumber: "2",
        invitationStatus: "NOT_INVITED",
        rsvpStatus: "PENDING",
        mealPreference: "VEGETARIAN",
        allergy: "kacang",
        inviteToken: token(),
      },
      {
        weddingId: wedding.id,
        name: "Pak Rahmat",
        side: "PARTNER_A",
        groupName: "WORK",
        pax: 3,
        household: "Kantor",
        rsvpStatus: "PENDING",
        invitationStatus: "NOT_INVITED",
        inviteToken: token(),
      },
    ],
  });

  await prisma.timelineEvent.createMany({
    data: [
      { weddingId: wedding.id, time: "06:30", title: "Makeup & wardrobe", location: "Ruang pengantin", pic: "MUA", sortOrder: 0 },
      { weddingId: wedding.id, time: "09:00", title: "Akad", location: "Masjid Salman ITB", pic: "WO", sortOrder: 1 },
      { weddingId: wedding.id, time: "11:30", title: "Resepsi", location: "Sabuga", pic: "MC", sortOrder: 2 },
    ],
  });
  await prisma.song.createMany({
    data: [
      { weddingId: wedding.id, title: "Perfect", artist: "Ed Sheeran", moment: "ENTRANCE" },
      { weddingId: wedding.id, title: "Sholawat", moment: "AKAD" },
    ],
  });

  console.log("Seed siap. Masuk dengan demo@buma.local / Demo@123321");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
