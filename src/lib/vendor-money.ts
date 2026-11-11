import { prisma } from "@/lib/prisma";
import { todayInApp } from "@/lib/utils";

const BOOKED = new Set(["BOOKED", "PAID"]);

function remainderTitle(name: string) {
  return `Pelunasan ${name}`;
}

export async function reconcileVendorMoney(
  weddingId: string,
  vendorId: string,
  options?: { seedDeposit?: boolean; paidBy?: string | null },
) {
  const [vendor, wedding] = await Promise.all([
    prisma.vendor.findFirst({ where: { id: vendorId, weddingId } }),
    prisma.wedding.findUnique({ where: { id: weddingId } }),
  ]);
  if (!vendor || !wedding) return;
  if (!BOOKED.has(vendor.status) || vendor.price <= 0) return;

  let item = await prisma.budgetItem.findFirst({ where: { weddingId, vendorId: vendor.id } });
  if (!item) {
    item = await prisma.budgetItem.findFirst({
      where: { weddingId, vendorId: null, name: vendor.name },
    });
  }
  if (item) {
    if (item.vendorId !== vendor.id) {
      await prisma.budgetItem.update({ where: { id: item.id }, data: { vendorId: vendor.id } });
    }
  } else {
    item = await prisma.budgetItem.create({
      data: {
        weddingId,
        vendorId: vendor.id,
        name: vendor.name,
        category: vendor.category,
        estimatedCost: vendor.price,
        actualCost: vendor.price,
        paidAmount: 0,
      },
    });
  }

  let payments = await prisma.payment.findMany({ where: { weddingId, vendorId: vendor.id } });
  let paidSum = payments.filter((row) => row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  const seedGap = Math.min(vendor.price, vendor.deposit) - paidSum;

  if (options?.seedDeposit && seedGap > 0) {
    const today = todayInApp();
    await prisma.payment.create({
      data: {
        weddingId,
        vendorId: vendor.id,
        title: `DP ${vendor.name}`,
        amount: seedGap,
        dueDate: today,
        paidDate: today,
        paidBy: options?.paidBy || (await sharedPotId(weddingId)),
      },
    });
    payments = await prisma.payment.findMany({ where: { weddingId, vendorId: vendor.id } });
    paidSum = payments.filter((row) => row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  }

  const status = paidSum >= vendor.price ? "PAID" : vendor.status === "PAID" ? "BOOKED" : vendor.status;
  if (status !== vendor.status) {
    await prisma.vendor.update({ where: { id: vendor.id }, data: { status } });
  }
  if (item.paidAmount !== paidSum) {
    await prisma.budgetItem.update({ where: { id: item.id }, data: { paidAmount: paidSum } });
  }

  const unpaid = payments.filter((row) => !row.paidDate);
  const autoRemainder = unpaid.find((row) => row.title === remainderTitle(vendor.name));
  const unpaidNeeded = Math.max(0, vendor.price - paidSum);
  if (unpaidNeeded <= 0) {
    if (autoRemainder) await prisma.payment.delete({ where: { id: autoRemainder.id } });
    return;
  }
  if (autoRemainder) {
    if (autoRemainder.amount !== unpaidNeeded) {
      await prisma.payment.update({
        where: { id: autoRemainder.id },
        data: { amount: unpaidNeeded, title: remainderTitle(vendor.name) },
      });
    }
    return;
  }
  if (unpaid.length > 0) return;

  const today = todayInApp();
  const due = new Date(wedding.weddingDate);
  due.setUTCDate(due.getUTCDate() - 30);
  await prisma.payment.create({
    data: {
      weddingId,
      vendorId: vendor.id,
      title: remainderTitle(vendor.name),
      amount: unpaidNeeded,
      dueDate: due.getTime() > today.getTime() ? due : today,
    },
  });
}

async function sharedPotId(weddingId: string) {
  const pots = await prisma.savingsPot.findMany({ where: { weddingId }, orderBy: { createdAt: "asc" } });
  return pots.find((pot) => pot.name.trim().toLowerCase() === "bersama")?.id ?? null;
}

export async function applyPaidPayment(weddingId: string, paymentId: string, paidBy?: string | null) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, weddingId } });
  if (!payment || payment.paidDate) return;
  const pot = paidBy?.trim() || payment.paidBy;
  if (!pot) return;
  await prisma.payment.update({ where: { id: payment.id }, data: { paidDate: todayInApp(), paidBy: pot } });
  if (payment.vendorId) await reconcileVendorMoney(weddingId, payment.vendorId);
}
