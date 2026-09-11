import { PageHeader } from "@/components/chrome";
import { PartnerInviteForm, PasswordForm, WeddingSettingsForm } from "@/components/settings-forms";
import { logoutAction } from "@/app/actions/auth";
import { requireWedding } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const { user, wedding } = await requireWedding();
  const partner = wedding.partnerId
    ? await prisma.user.findUnique({ where: { id: wedding.partnerId } })
    : null;

  return (
    <div>
      <PageHeader
        kicker="Pengaturan"
        title="Detail pernikahan dan akun"
        description="Semua fitur terbuka di rebuild ini. Tidak ada paket berbayar."
      />
      <div className="gutter grid max-w-2xl gap-10 pb-12">
        <section className="surface p-5">
          <h2 className="font-medium">Pernikahan</h2>
          <div className="mt-4">
            <WeddingSettingsForm
              partnerAName={wedding.partnerAName}
              partnerBName={wedding.partnerBName}
              weddingDate={wedding.weddingDate}
              location={wedding.location}
              estimatedGuests={wedding.estimatedGuests}
              weddingType={wedding.weddingType}
              marriageTrack={wedding.marriageTrack}
              totalBudget={wedding.totalBudget}
            />
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="font-medium">Undang pasangan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Satu data, dua akun. Kirim tautannya ke email pasangan, atau buka sendiri untuk tes localhost.</p>
          <div className="mt-4">
            <PartnerInviteForm partnerName={partner?.name} partnerEmail={partner?.email} />
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="font-medium">Akun</h2>
          <p className="mt-1 text-sm text-muted-foreground">Masuk sebagai {user.name} · {user.email}</p>
          <div className="mt-4">
            <PasswordForm />
          </div>
          <form action={logoutAction} className="mt-4">
            <button className="text-sm text-muted-foreground hover:text-foreground">Keluar</button>
          </form>
        </section>
      </div>
    </div>
  );
}
