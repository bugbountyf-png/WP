import { prisma } from "@/lib/prisma";
import { todayInApp } from "@/lib/utils";

const ACTIVE = new Set(["BOOKED", "PAID", "NEGOTIATING"]);

function remainderTitle(name: string) {
  return `Pelunasan ${name}`;
}

export async function reconcileVendorMoney(weddingId: string, vendorId: string) {
  const [vendor, wedding] = await Promise.all([
    prisma.vendor.findFirst({ where: { id: vendorId, weddingId } }),
    prisma.wedding.findUnique({ where: { id: weddingId } }),
  ]);
  if (!vendor || !wedding) return;
  if (!ACTIVE.has(vendor.status) || vendor.price <= 0) return;

  let item = await prisma.budgetItem.findFirst({ where: { weddingId, vendorId: vendor.id } });
  if (!item) {
    item = await prisma.budgetItem.findFirst({
      where: { weddingId, vendorId: null, name: vendor.name },
    });
  }
  if (item) {
    await prisma.budgetItem.update({
      where: { id: item.id },
      data: {
        vendorId: vendor.id,
        name: vendor.name,
        category: vendor.category,
        estimatedCost: vendor.price,
        actualCost: Math.max(item.actualCost || item.estimatedCost, vendor.price),
      },
    });
  } else {
    item = await prisma.budgetItem.create({
      data: {
        weddingId,
        vendorId: vendor.id,
        name: vendor.name,
        category: vendor.category,
        estimatedCost: vendor.price,
        actualCost: vendor.price,
        paidAmount: vendor.deposit,
      },
    });
  }

  const payments = await prisma.payment.findMany({ where: { weddingId, vendorId: vendor.id } });
  const paidSum = payments.filter((row) => row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  const unpaid = payments.filter((row) => !row.paidDate);
  const today = todayInApp();

  let cashPaid = paidSum;
  if (vendor.deposit > paidSum) {
    const gap = vendor.deposit - paidSum;
    await prisma.payment.create({
      data: {
        weddingId,
        vendorId: vendor.id,
        title: `DP ${vendor.name}`,
        amount: gap,
        dueDate: today,
        paidDate: today,
      },
    });
    cashPaid = vendor.deposit;
  }
  cashPaid = Math.min(vendor.price, cashPaid);

  await prisma.vendor.update({ where: { id: vendor.id }, data: { deposit: cashPaid } });
  await prisma.budgetItem.update({ where: { id: item.id }, data: { paidAmount: cashPaid } });

  const unpaidNeeded = Math.max(0, vendor.price - cashPaid);
  const autoRemainder = unpaid.find((row) => row.title.startsWith("Pelunasan "));
  if (unpaidNeeded <= 0) return;

  if (autoRemainder) {
    if (autoRemainder.amount !== unpaidNeeded) {
      await prisma.payment.update({
        where: { id: autoRemainder.id },
        data: { amount: unpaidNeeded, title: remainderTitle(vendor.name) },
      });
    }
    return;
  }
  if (unpaid.length === 1 && unpaid[0].amount !== unpaidNeeded) {
    await prisma.payment.update({ where: { id: unpaid[0].id }, data: { amount: unpaidNeeded } });
    return;
  }
  if (unpaid.length === 0) {
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
}

export async function applyPaidPayment(weddingId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, weddingId } });
  if (!payment) return;
  await prisma.payment.update({ where: { id: payment.id }, data: { paidDate: new Date() } });
  if (!payment.vendorId) return;

  const vendor = await prisma.vendor.findFirst({ where: { id: payment.vendorId, weddingId } });
  if (!vendor) return;
  const paid = await prisma.payment.findMany({
    where: { weddingId, vendorId: vendor.id, paidDate: { not: null } },
  });
  const paidSum = paid.reduce((sum, row) => sum + row.amount, 0);
  const paidExceptThis = paidSum - payment.amount;
  const depositOutsideLedger = Math.max(0, vendor.deposit - paidExceptThis);
  const cashPaid = Math.min(vendor.price || paidSum + depositOutsideLedger, paidSum + depositOutsideLedger);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      deposit: cashPaid,
      status: vendor.price > 0 && cashPaid >= vendor.price ? "PAID" : vendor.status,
    },
  });
  await prisma.budgetItem.updateMany({
    where: { weddingId, vendorId: vendor.id },
    data: { paidAmount: cashPaid },
  });
}
