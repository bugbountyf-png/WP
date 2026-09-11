export type BudgetLine = {
  name?: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  vendorId?: string | null;
};

export type BudgetPayment = {
  amount: number;
  paidDate: Date | string | null;
  vendorId?: string | null;
};

export type BudgetVendor = {
  id: string;
  name?: string;
  price: number;
  deposit: number;
  status: string;
};

export type BudgetSeserahan = {
  estimatedCost: number;
  actualCost: number;
  status: string;
};

const BOOKED_VENDOR = new Set(["BOOKED", "PAID"]);

function sameName(a?: string, b?: string) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

export function budgetTotals(input: {
  items: BudgetLine[];
  payments: BudgetPayment[];
  savings?: { amount: number }[];
  vendors?: BudgetVendor[];
  seserahan?: BudgetSeserahan[];
}) {
  const bookedVendors = (input.vendors ?? []).filter((vendor) => BOOKED_VENDOR.has(vendor.status));
  const claimed = new Set<BudgetLine>();
  const itemByVendor = new Map(input.items.filter((row) => row.vendorId).map((row) => [row.vendorId as string, row]));

  let estimated = 0;
  let itemActual = 0;

  for (const vendor of bookedVendors) {
    const linked = itemByVendor.get(vendor.id) ?? input.items.find((row) => !row.vendorId && sameName(row.name, vendor.name));
    if (linked) claimed.add(linked);
    estimated += Math.max(linked?.estimatedCost ?? 0, vendor.price);
    itemActual += Math.max(linked?.actualCost || linked?.estimatedCost || 0, vendor.price);
  }

  for (const item of input.items) {
    if (claimed.has(item)) continue;
    if (item.vendorId && bookedVendors.some((vendor) => vendor.id === item.vendorId)) continue;
    estimated += item.estimatedCost;
    itemActual += item.actualCost || item.estimatedCost;
  }

  for (const row of input.seserahan ?? []) {
    if (row.status === "REJECTED") continue;
    estimated += row.estimatedCost;
    itemActual += row.actualCost || row.estimatedCost;
  }

  const paymentPaid = input.payments.filter((row) => row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  const paymentUnpaid = input.payments.filter((row) => !row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  const paidByVendor = new Map<string, number>();
  for (const row of input.payments) {
    if (!row.vendorId || !row.paidDate) continue;
    paidByVendor.set(row.vendorId, (paidByVendor.get(row.vendorId) ?? 0) + row.amount);
  }
  let extraPaid = 0;
  for (const vendor of bookedVendors) {
    extraPaid += Math.max(0, vendor.deposit - (paidByVendor.get(vendor.id) ?? 0));
  }
  for (const item of input.items) {
    if (claimed.has(item)) continue;
    if (item.vendorId && bookedVendors.some((vendor) => vendor.id === item.vendorId)) continue;
    extraPaid += item.paidAmount;
  }
  const seserahanPaid = (input.seserahan ?? [])
    .filter((row) => row.status === "PURCHASED")
    .reduce((sum, row) => sum + (row.actualCost || row.estimatedCost), 0);

  const paid = paymentPaid + extraPaid + seserahanPaid;
  const remainingPay = Math.max(paymentUnpaid, Math.max(0, itemActual - paid));
  const actual = Math.max(itemActual, paid + remainingPay);
  const allocated = Math.max(estimated, actual);
  const saved = (input.savings ?? []).reduce((sum, row) => sum + row.amount, 0);

  return { estimated, allocated, actual, paid, remainingPay, saved, paymentUnpaid };
}

export type BudgetHealth = {
  status: "GETTING_STARTED" | "HEALTHY" | "WARNING" | "AT_RISK";
  label: string;
  score: number;
  hint: string;
};

export function budgetHealth(input: {
  totalBudget: number;
  totalEstimated: number;
  totalPaid: number;
  currentSavings: number;
  expenseCount: number;
  monthsRemaining: number;
}) {
  if (input.totalBudget <= 0) {
    return {
      status: "GETTING_STARTED",
      label: "Baru mulai",
      score: 0,
      hint: "Isi total budget di pengaturan supaya angkanya bisa dibaca.",
    } satisfies BudgetHealth;
  }

  const allocated = input.totalEstimated / input.totalBudget;
  const saved = input.currentSavings / input.totalBudget;
  const paid = input.totalPaid / input.totalBudget;

  if (input.expenseCount === 0 && saved < 0.08) {
    return {
      status: "GETTING_STARTED",
      label: "Baru mulai",
      score: 55,
      hint: "Checklist sudah ada. Catat pengeluaran pertama atau setor tabungan supaya skornya hidup.",
    } satisfies BudgetHealth;
  }

  let score = 40;
  if (allocated >= 0.4 && allocated <= 1) score += 25;
  else if (allocated > 1) score -= 15;
  else score += Math.round(allocated * 20);

  if (saved >= 0.15) score += 20;
  else if (saved >= 0.05) score += 12;
  else score += Math.round(saved * 80);

  if (paid >= 0.1) score += 15;
  else score += Math.round(paid * 80);

  if (input.monthsRemaining <= 2 && saved < 0.5) score -= 15;
  score = Math.max(0, Math.min(100, score));

  if (allocated > 1.05 || (input.monthsRemaining <= 3 && saved < 0.25)) {
    return {
      status: "AT_RISK",
      label: "Berisiko",
      score,
      hint: "Alokasi atau tabungan belum seimbang dengan sisa waktu. Rapikan pos yang paling besar dulu.",
    } satisfies BudgetHealth;
  }
  if (allocated > 0.9 || saved < 0.05) {
    return {
      status: "WARNING",
      label: "Perlu perhatian",
      score,
      hint: "Masih aman, tapi beberapa pos sudah mepet. Cek yang belum ada cadangannya.",
    } satisfies BudgetHealth;
  }
  return {
    status: "HEALTHY",
    label: "Sehat",
    score,
    hint: "Angkanya bergerak wajar. Lanjut isi yang masih kosong, jangan ditunda ke bulan terakhir.",
  } satisfies BudgetHealth;
}

export function monthsBetween(from: Date, to: Date) {
  const years = to.getUTCFullYear() - from.getUTCFullYear();
  const months = to.getUTCMonth() - from.getUTCMonth();
  return Math.max(1, years * 12 + months);
}
