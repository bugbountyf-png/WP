import { notFound, redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSessionWedding } from "./auth";

export async function requireUser() {
  const { user, wedding } = await getSessionWedding();
  if (!user) {
    redirect("/login");
  }
  return { user, wedding };
}

export async function requireWedding() {
  const { user, wedding } = await requireUser();
  if (!wedding) redirect("/onboarding");
  return { user, wedding };
}

export async function getWeddingDashboard(weddingId: string) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      owner: true,
      partner: true,
      tasks: true,
      budgetItems: true,
      payments: true,
      vendors: true,
      guests: true,
      savings: true,
      reminders: true,
      seserahanItems: true,
    },
  });
  if (!wedding) notFound();
  return wedding;
}
