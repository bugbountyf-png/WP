export function moneySide(side?: string | null): string {
  const value = side?.trim() ?? "";
  if (!value) return "";
  const upper = value.toUpperCase();
  if (upper === "PARTNER_A") return "CPP";
  if (upper === "PARTNER_B") return "CPW";
  if (upper === "MAMA_BUDI") return "MAMA";
  if (upper === "CPP" || upper === "CPW" || upper === "MAMA" || upper === "SHARED") return upper;
  if (/^c[a-z0-9]{20,}$/i.test(value)) return value;
  return "";
}

export type BudgetLine = {
  id?: string;
  name?: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  vendorId?: string | null;
  paidBy?: string | null;
};

export type BudgetPayment = {
  id?: string;
  title?: string;
  amount: number;
  paidDate: Date | string | null;
  vendorId?: string | null;
  paidBy?: string | null;
};

export type BudgetVendor = {
  id: string;
  name?: string;
  price: number;
  deposit: number;
  status: string;
};

export type BudgetSeserahan = {
  id?: string;
  name?: string;
  estimatedCost: number;
  actualCost: number;
  status: string;
  buyer?: string | null;
};

const BOOKED_VENDOR = new Set(["BOOKED", "PAID"]);

export type PotMove = {
  id: string;
  direction: "in" | "out";
  label: string;
  detail: string;
  amount: number;
  when: string | null;
};

export type PotStatement = {
  pot: string;
  title: string;
  hint: string;
  balance: number;
  deposited: number;
  spent: number;
  moves: PotMove[];
};

const UNASSIGNED = "";

export function planKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function paymentPlanKey(title?: string | null) {
  return planKey(title).replace(/^(dp|sisa|pelunasan)\s+/, "");
}

function whenIso(value?: Date | string | null) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

type CashOut = {
  id: string;
  pot: string;
  amount: number;
  label: string;
  detail: string;
  when: string | null;
  kind: "payment" | "deposit" | "item" | "seserahan";
};

type MoneyPlan = {
  id: string;
  name: string;
  vendorId?: string | null;
  estimated: number;
  cost: number;
  recordedPaid: number;
  pot: string;
  kind: "item" | "vendor" | "seserahan";
};

function bookedVendorsOf(vendors?: BudgetVendor[]) {
  return (vendors ?? []).filter((vendor) => BOOKED_VENDOR.has(vendor.status));
}

function linkedBudgetItem(items: BudgetLine[], vendor: BudgetVendor) {
  return (
    items.find((row) => row.vendorId === vendor.id) ??
    items.find((row) => !row.vendorId && sameName(row.name, vendor.name))
  );
}

function buildPlans(input: {
  items: BudgetLine[];
  vendors?: BudgetVendor[];
  seserahan?: BudgetSeserahan[];
}) {
  const booked = bookedVendorsOf(input.vendors);
  const claimed = new Set<BudgetLine>();
  const plans: MoneyPlan[] = [];

  for (const vendor of booked) {
    const linked = linkedBudgetItem(input.items, vendor);
    if (linked) claimed.add(linked);
    plans.push({
      id: linked?.id ?? vendor.id,
      name: linked?.name?.trim() || vendor.name?.trim() || "Vendor",
      vendorId: vendor.id,
      estimated: Math.max(linked?.estimatedCost ?? 0, vendor.price),
      cost: Math.max(linked?.actualCost || linked?.estimatedCost || 0, vendor.price),
      recordedPaid: Math.max(vendor.deposit, linked?.paidAmount ?? 0),
      pot: moneySide(linked?.paidBy),
      kind: "vendor",
    });
  }

  input.items.forEach((item, index) => {
    if (claimed.has(item)) return;
    if (item.vendorId && booked.some((vendor) => vendor.id === item.vendorId)) return;
    plans.push({
      id: item.id ?? `item-${index}`,
      name: item.name?.trim() || "Pengeluaran",
      vendorId: item.vendorId,
      estimated: item.estimatedCost,
      cost: item.actualCost || item.estimatedCost,
      recordedPaid: item.paidAmount,
      pot: moneySide(item.paidBy),
      kind: "item",
    });
  });

  const names = new Set(plans.map((plan) => planKey(plan.name)));
  (input.seserahan ?? []).forEach((row, index) => {
    if (row.status === "REJECTED") return;
    if (names.has(planKey(row.name))) return;
    const cost = row.actualCost || row.estimatedCost;
    plans.push({
      id: row.id ?? `seserahan-${index}`,
      name: row.name?.trim() || "Seserahan",
      estimated: row.estimatedCost,
      cost,
      recordedPaid: row.status === "PURCHASED" ? cost : 0,
      pot: moneySide(row.buyer),
      kind: "seserahan",
    });
  });

  return plans;
}

function assignPayments(plans: MoneyPlan[], payments: BudgetPayment[]) {
  const used = new Set<number>();
  const groups = plans.map(() => [] as BudgetPayment[]);
  payments.forEach((row, index) => {
    const key = paymentPlanKey(row.title);
    const planIndex = plans.findIndex((plan) => {
      if (plan.vendorId && row.vendorId && plan.vendorId === row.vendorId) return true;
      return Boolean(key) && planKey(plan.name) === key;
    });
    if (planIndex < 0) return;
    used.add(index);
    groups[planIndex].push(row);
  });
  return { used, groups };
}

function paidSum(rows: BudgetPayment[]) {
  return rows.filter((row) => row.paidDate).reduce((sum, row) => sum + row.amount, 0);
}

function collectOutflows(input: {
  items: BudgetLine[];
  payments: BudgetPayment[];
  vendors?: BudgetVendor[];
  seserahan?: BudgetSeserahan[];
}) {
  const plans = buildPlans(input);
  const { groups } = assignPayments(plans, input.payments);
  const outs: CashOut[] = [];

  input.payments.forEach((row, index) => {
    if (!row.paidDate) return;
    outs.push({
      id: row.id ?? `payment-${index}`,
      pot: moneySide(row.paidBy),
      amount: row.amount,
      label: row.title?.trim() || "Pembayaran",
      detail: "Pembayaran lunas",
      when: whenIso(row.paidDate),
      kind: "payment",
    });
  });

  plans.forEach((plan, index) => {
    const extra = Math.max(0, plan.recordedPaid - paidSum(groups[index]));
    if (extra <= 0) return;
    outs.push({
      id: `extra-${plan.id}`,
      pot: plan.pot,
      amount: extra,
      label: plan.kind === "vendor" ? `DP ${plan.name}` : plan.name,
      detail: plan.kind === "seserahan" ? "Seserahan yang sudah dibeli" : plan.kind === "vendor" ? "Uang muka vendor" : "Sudah dibayar di pos anggaran",
      when: null,
      kind: plan.kind === "seserahan" ? "seserahan" : plan.kind === "vendor" ? "deposit" : "item",
    });
  });

  return outs;
}

export function paymentsForPlan<T extends BudgetPayment>(name: string | null | undefined, vendorId: string | null | undefined, payments: T[]) {
  const key = planKey(name);
  return payments.filter((row) => {
    if (vendorId && row.vendorId === vendorId) return true;
    return Boolean(key) && paymentPlanKey(row.title) === key;
  });
}

function sameName(a?: string, b?: string) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

export function budgetTotals(input: {
  items: BudgetLine[];
  payments: BudgetPayment[];
  savings?: { amount: number; side?: string | null }[];
  vendors?: BudgetVendor[];
  seserahan?: BudgetSeserahan[];
}) {
  const plans = buildPlans(input);
  const { used, groups } = assignPayments(plans, input.payments);
  let estimated = 0;
  let itemActual = 0;
  let remainingPay = 0;

  plans.forEach((plan, index) => {
    estimated += plan.estimated;
    itemActual += plan.cost;
    const cash = paidSum(groups[index]) + Math.max(0, plan.recordedPaid - paidSum(groups[index]));
    const still = Math.max(0, plan.cost - cash);
    const scheduled = groups[index].filter((row) => !row.paidDate).reduce((sum, row) => sum + row.amount, 0);
    remainingPay += still + Math.max(0, scheduled - still);
  });

  input.payments.forEach((row, index) => {
    if (!used.has(index) && !row.paidDate) remainingPay += row.amount;
  });

  const paymentUnpaid = input.payments.filter((row) => !row.paidDate).reduce((sum, row) => sum + row.amount, 0);
  const outs = collectOutflows(input);
  let paymentPaid = 0;
  let extraPaid = 0;
  let seserahanPaid = 0;
  for (const row of outs) {
    if (row.kind === "payment") paymentPaid += row.amount;
    else if (row.kind === "seserahan") seserahanPaid += row.amount;
    else extraPaid += row.amount;
  }

  const paid = paymentPaid + extraPaid + seserahanPaid;
  const actual = Math.max(itemActual, paid + remainingPay);
  const allocated = Math.max(estimated, actual);
  const saved = (input.savings ?? []).reduce((sum, row) => sum + row.amount, 0);

  return {
    estimated,
    allocated,
    actual,
    paid,
    remainingPay,
    saved,
    paymentUnpaid,
  };
}

export type PotCatalog = { id: string; name: string };

export function potLedgers(
  input: {
    items: BudgetLine[];
    payments: BudgetPayment[];
    savings?: { id?: string; amount: number; side?: string | null; note?: string | null; occurredOn?: Date | string | null }[];
    vendors?: BudgetVendor[];
    seserahan?: BudgetSeserahan[];
  },
  catalog: PotCatalog[] = [],
): PotStatement[] {
  const buckets = new Map<string, PotMove[]>();
  const deposited = new Map<string, number>();
  const spent = new Map<string, number>();
  const add = (map: Map<string, number>, key: string, amount: number) => map.set(key, (map.get(key) ?? 0) + amount);
  const bucket = (key: string) => {
    const list = buckets.get(key) ?? [];
    buckets.set(key, list);
    return list;
  };

  (input.savings ?? []).forEach((row, index) => {
    if (!row.amount) return;
    const pot = moneySide(row.side);
    const incoming = row.amount > 0;
    const amount = Math.abs(row.amount);
    if (incoming) add(deposited, pot, amount);
    else add(spent, pot, amount);
    bucket(pot).push({
      id: row.id ?? `savings-${index}`,
      direction: incoming ? "in" : "out",
      label: row.note?.trim() || (incoming ? "Setoran" : "Penarikan"),
      detail: incoming ? "Masuk ke rekening" : "Ditarik dari rekening",
      amount,
      when: whenIso(row.occurredOn),
    });
  });

  for (const row of collectOutflows(input)) {
    add(spent, row.pot, row.amount);
    bucket(row.pot).push({
      id: row.id,
      direction: "out",
      label: row.label,
      detail: row.detail,
      amount: row.amount,
      when: row.when,
    });
  }

  const names = new Map(catalog.map((pot) => [pot.id, pot.name]));
  const order = [...catalog.map((pot) => pot.id)];
  for (const key of buckets.keys()) {
    if (!order.includes(key) && (deposited.get(key) || spent.get(key) || (buckets.get(key)?.length ?? 0) > 0)) order.push(key);
  }

  return order
    .filter((pot) => pot !== UNASSIGNED || (buckets.get(pot)?.length ?? 0) > 0)
    .map((pot) => {
      const moves = [...(buckets.get(pot) ?? [])].sort((a, b) => {
        const left = a.when ? new Date(a.when).getTime() : 0;
        const right = b.when ? new Date(b.when).getTime() : 0;
        return right - left;
      });
      const inAmount = deposited.get(pot) ?? 0;
      const outAmount = spent.get(pot) ?? 0;
      return {
        pot,
        title: names.get(pot) || (pot ? pot : "Belum dipilih"),
        hint: "",
        deposited: inAmount,
        spent: outAmount,
        balance: inAmount - outAmount,
        moves,
      };
    });
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
  remainingPay?: number;
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

  const billsUncovered =
    input.totalBudget > 0 && (input.remainingPay ?? 0) > input.currentSavings && input.monthsRemaining <= 3;
  if (input.monthsRemaining <= 2 && saved < 0.5) score -= 15;
  if (billsUncovered) score -= 10;
  score = Math.max(0, Math.min(100, score));

  if (allocated > 1.05 || (input.monthsRemaining <= 3 && saved < 0.25) || billsUncovered) {
    return {
      status: "AT_RISK",
      label: "Berisiko",
      score,
      hint: billsUncovered
        ? "Sisa pelunasan lebih besar dari tabungan. Isi pot yang masih kosong, atau geser jadwal bayar."
        : "Alokasi atau tabungan belum seimbang dengan sisa waktu. Rapikan pos yang paling besar dulu.",
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
