import { prisma } from "@/lib/prisma";
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS } from "@/lib/labels";

const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

export async function ensureBudgetCategories(weddingId: string) {
  const existing = await prisma.budgetCategory.findMany({ where: { weddingId }, orderBy: order });
  if (existing.length > 0) return mergeDuplicateCategories(weddingId);

  const [items, vendors, researches] = await Promise.all([
    prisma.budgetItem.findMany({ where: { weddingId }, select: { category: true } }),
    prisma.vendor.findMany({ where: { weddingId }, select: { category: true } }),
    prisma.research.findMany({ where: { weddingId }, select: { category: true } }),
  ]);
  const used = new Set(
    [...items, ...vendors, ...researches].map((row) => row.category).filter((value) => Boolean(value)),
  );
  const known = new Set<string>(BUDGET_CATEGORIES);

  const seeded: { code: string; id: string }[] = [];
  for (const [index, code] of BUDGET_CATEGORIES.entries()) {
    const row = await prisma.budgetCategory.create({
      data: { weddingId, name: BUDGET_CATEGORY_LABELS[code], sortOrder: index },
    });
    seeded.push({ code, id: row.id });
  }

  let sortOrder = BUDGET_CATEGORIES.length;
  for (const code of used) {
    if (known.has(code) || /^c[a-z0-9]{20,}$/i.test(code)) continue;
    const row = await prisma.budgetCategory.create({
      data: { weddingId, name: code, sortOrder },
    });
    sortOrder += 1;
    seeded.push({ code, id: row.id });
  }

  for (const { code, id } of seeded) {
    await prisma.budgetItem.updateMany({ where: { weddingId, category: code }, data: { category: id } });
    await prisma.vendor.updateMany({ where: { weddingId, category: code }, data: { category: id } });
    await prisma.research.updateMany({ where: { weddingId, category: code }, data: { category: id } });
  }

  return mergeDuplicateCategories(weddingId);
}

async function mergeDuplicateCategories(weddingId: string) {
  const rows = await prisma.budgetCategory.findMany({ where: { weddingId }, orderBy: order });
  const kept = new Map<string, string>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const target = kept.get(key);
    if (!target) {
      kept.set(key, row.id);
      continue;
    }
    await prisma.budgetItem.updateMany({ where: { weddingId, category: row.id }, data: { category: target } });
    await prisma.vendor.updateMany({ where: { weddingId, category: row.id }, data: { category: target } });
    await prisma.research.updateMany({ where: { weddingId, category: row.id }, data: { category: target } });
    await prisma.budgetCategory.deleteMany({ where: { id: row.id, weddingId } });
  }
  return prisma.budgetCategory.findMany({ where: { weddingId }, orderBy: order });
}

export async function resolveBudgetCategory(weddingId: string, value: FormDataEntryValue | null) {
  const categories = await ensureBudgetCategories(weddingId);
  const raw = String(value ?? "").trim();
  const found =
    categories.find((row) => row.id === raw) ??
    categories.find((row) => row.name.trim().toLowerCase() === raw.toLowerCase());
  if (found) return found.id;
  return categories.find((row) => row.name.trim().toLowerCase() === "lainnya")?.id ?? categories[0].id;
}

export function budgetCategoryName(categories: { id: string; name: string }[], value?: string | null) {
  if (value === "DOWRY") return "Seserahan";
  return (
    categories.find((row) => row.id === value)?.name ??
    (value && value in BUDGET_CATEGORY_LABELS ? BUDGET_CATEGORY_LABELS[value as keyof typeof BUDGET_CATEGORY_LABELS] : value || "Lainnya")
  );
}
