import { requireWedding } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { formatShortDate } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, wedding } = await requireWedding();
  return (
    <div className="min-h-dvh bg-background md:pl-60">
      <AppNav
        userName={user.name}
        couple={{
          partnerAName: wedding.partnerAName,
          partnerBName: wedding.partnerBName,
          dateLabel: formatShortDate(wedding.weddingDate),
          location: wedding.location,
          showSeserahan: wedding.marriageTrack === "KUA",
        }}
      />
      <main className="pb-24 md:pb-10">{children}</main>
    </div>
  );
}
