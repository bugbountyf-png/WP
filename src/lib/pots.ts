import { prisma } from "@/lib/prisma";

const LEGACY = ["CPP", "CPW", "MAMA", "MAMA_BUDI", "SHARED", "PARTNER_A", "PARTNER_B"] as const;

export async function ensureSavingsPots(wedding: { id: string; partnerAName: string; partnerBName: string }) {
  const existing = await prisma.savingsPot.findMany({
    where: { weddingId: wedding.id },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length > 0) return mergeDuplicatePots(wedding.id);

  const [savings, payments, items] = await Promise.all([
    prisma.savingsEntry.findMany({ where: { weddingId: wedding.id }, select: { side: true } }),
    prisma.payment.findMany({ where: { weddingId: wedding.id }, select: { paidBy: true } }),
    prisma.budgetItem.findMany({ where: { weddingId: wedding.id }, select: { paidBy: true } }),
  ]);
  const used = new Set(
    [...savings.map((row) => row.side), ...payments.map((row) => row.paidBy), ...items.map((row) => row.paidBy)]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toUpperCase()),
  );

  const partnerA = await prisma.savingsPot.create({ data: { weddingId: wedding.id, name: wedding.partnerAName } });
  const partnerB = await prisma.savingsPot.create({ data: { weddingId: wedding.id, name: wedding.partnerBName } });
  const shared = await prisma.savingsPot.create({ data: { weddingId: wedding.id, name: "Bersama" } });
  const mama =
    used.has("MAMA") || used.has("MAMA_BUDI")
      ? await prisma.savingsPot.create({ data: { weddingId: wedding.id, name: "Mama Budi" } })
      : null;

  const map = new Map<string, string>([
    ["CPP", partnerA.id],
    ["PARTNER_A", partnerA.id],
    ["CPW", partnerB.id],
    ["PARTNER_B", partnerB.id],
    ["SHARED", shared.id],
  ]);
  if (mama) {
    map.set("MAMA", mama.id);
    map.set("MAMA_BUDI", mama.id);
  }

  async function rewrite(table: "savingsEntry" | "payment" | "budgetItem", field: "side" | "paidBy") {
    for (const [legacy, id] of map) {
      if (table === "savingsEntry") {
        await prisma.savingsEntry.updateMany({ where: { weddingId: wedding.id, side: legacy }, data: { side: id } });
      } else if (table === "payment") {
        await prisma.payment.updateMany({ where: { weddingId: wedding.id, paidBy: legacy }, data: { paidBy: id } });
      } else {
        await prisma.budgetItem.updateMany({ where: { weddingId: wedding.id, paidBy: legacy }, data: { paidBy: id } });
      }
    }
    if (table === "savingsEntry") {
      await prisma.savingsEntry.updateMany({ where: { weddingId: wedding.id, side: null }, data: { side: shared.id } });
    }
  }

  await rewrite("savingsEntry", "side");
  await rewrite("payment", "paidBy");
  await rewrite("budgetItem", "paidBy");
  void LEGACY;

  return mergeDuplicatePots(wedding.id);
}

async function mergeDuplicatePots(weddingId: string) {
  const pots = await prisma.savingsPot.findMany({ where: { weddingId }, orderBy: { createdAt: "asc" } });
  const kept = new Map<string, string>();
  for (const pot of pots) {
    const key = pot.name.trim().toLowerCase();
    const target = kept.get(key);
    if (!target) {
      kept.set(key, pot.id);
      continue;
    }
    await prisma.savingsEntry.updateMany({ where: { weddingId, side: pot.id }, data: { side: target } });
    await prisma.payment.updateMany({ where: { weddingId, paidBy: pot.id }, data: { paidBy: target } });
    await prisma.budgetItem.updateMany({ where: { weddingId, paidBy: pot.id }, data: { paidBy: target } });
    await prisma.seserahanItem.updateMany({ where: { weddingId, buyer: pot.id }, data: { buyer: target } });
    await prisma.savingsPot.deleteMany({ where: { id: pot.id, weddingId } });
  }
  return prisma.savingsPot.findMany({ where: { weddingId }, orderBy: { createdAt: "asc" } });
}

export async function renamePartnerPots(
  weddingId: string,
  previous: { partnerAName: string; partnerBName: string },
  next: { partnerAName: string; partnerBName: string },
) {
  const pots = await prisma.savingsPot.findMany({ where: { weddingId }, orderBy: { createdAt: "asc" } });
  const pairs = [
    [previous.partnerAName, next.partnerAName],
    [previous.partnerBName, next.partnerBName],
  ];
  for (const [from, to] of pairs) {
    const before = from.trim().toLowerCase();
    const after = to.trim().slice(0, 40);
    if (!before || !after || before === after.toLowerCase()) continue;
    const source = pots.find((pot) => pot.name.trim().toLowerCase() === before);
    if (!source) continue;
    const taken = pots.some((pot) => pot.id !== source.id && pot.name.trim().toLowerCase() === after.toLowerCase());
    if (taken) continue;
    await prisma.savingsPot.update({ where: { id: source.id }, data: { name: after } });
    source.name = after;
  }
}
