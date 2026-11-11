import { paymentsForPlan } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { todayInApp } from "@/lib/utils";

export async function materializePaidItems(weddingId: string) {
  const [items, payments] = await Promise.all([
    prisma.budgetItem.findMany({ where: { weddingId } }),
    prisma.payment.findMany({ where: { weddingId } }),
  ]);
  const today = todayInApp();
  for (const item of items) {
    const matched = paymentsForPlan(item.name, item.vendorId, payments);
    if (matched.length > 0 || item.paidAmount <= 0) continue;
    const created = await prisma.payment.create({
      data: {
        weddingId,
        vendorId: item.vendorId,
        title: item.name,
        amount: item.paidAmount,
        dueDate: today,
        paidDate: today,
        paidBy: item.paidBy,
      },
    });
    payments.push(created);
    await prisma.budgetItem.update({ where: { id: item.id }, data: { paidAmount: 0 } });
  }
}
