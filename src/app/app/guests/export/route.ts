import { GUEST_GROUP_LABELS, INVITE_STATUS_LABELS, MEAL_LABELS, RSVP_LABELS } from "@/lib/labels";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { requireWedding } from "@/lib/session";

export async function GET() {
  const { wedding } = await requireWedding();
  const rows = await prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" } });
  const csv = toCsv(
    rows.map((row) => ({
      nama: row.name,
      sisi: row.side === "PARTNER_B" ? wedding.partnerBName : wedding.partnerAName,
      kelompok: GUEST_GROUP_LABELS[row.groupName as keyof typeof GUEST_GROUP_LABELS] ?? row.groupName,
      telepon: row.phone ?? "",
      pax: row.pax,
      plus_one: row.plusOneAllowed,
      nama_plus_one: row.plusOneName ?? "",
      menu: MEAL_LABELS[row.mealPreference as keyof typeof MEAL_LABELS] ?? row.mealPreference,
      alergi: row.allergy ?? "",
      alamat: row.address ?? "",
      rumah_tangga: row.household ?? "",
      meja: row.tableNumber ?? "",
      undangan: INVITE_STATUS_LABELS[row.invitationStatus as keyof typeof INVITE_STATUS_LABELS] ?? row.invitationStatus,
      rsvp: RSVP_LABELS[row.rsvpStatus as keyof typeof RSVP_LABELS] ?? row.rsvpStatus,
    })),
  );
  return new Response(csv || "nama,sisi,kelompok,telepon,pax\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tamu-${wedding.invitationSlug}.csv"`,
    },
  });
}
