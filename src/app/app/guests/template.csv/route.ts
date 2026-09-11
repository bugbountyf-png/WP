import { GUEST_CSV_TEMPLATE } from "@/lib/csv";
import { requireWedding } from "@/lib/session";

export async function GET() {
  await requireWedding();
  return new Response(GUEST_CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-tamu.csv"',
    },
  });
}
