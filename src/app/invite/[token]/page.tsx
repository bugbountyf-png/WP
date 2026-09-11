import { prisma } from "@/lib/prisma";
import { acceptInviteAction } from "@/app/actions/wedding";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const invite = await prisma.partnerInvite.findUnique({ where: { token }, include: { wedding: true } });
  const user = await getCurrentUser();
  if (!invite) {
    return <p className="p-10 text-center">Undangan ini tidak ditemukan.</p>;
  }
  if (invite.acceptedAt) {
    return (
      <p className="p-10 text-center">
        Undangan ini sudah dipakai.{" "}
        <Link href="/app" className="text-primary">
          Masuk ke dashboard
        </Link>
      </p>
    );
  }
  return (
    <div className="gutter mx-auto max-w-lg py-16 text-center">
      <h1 className="display text-3xl">Undang gabung perencanaan</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {invite.wedding.partnerAName} & {invite.wedding.partnerBName} mengundang kamu ke data pernikahan yang sama.
      </p>
      {error === "email" ? (
        <p className="mt-4 text-sm text-destructive">
          Masuk dengan email {invite.email} supaya bisa gabung. Akun yang sekarang berbeda.
        </p>
      ) : null}
      {!user ? (
        <div className="mt-8 flex justify-center gap-3">
          <Link className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" href={`/login?next=/invite/${token}`}>
            Masuk
          </Link>
          <Link className="rounded-lg border border-border px-4 py-2 text-sm" href={`/register?next=/invite/${token}`}>
            Bikin akun
          </Link>
        </div>
      ) : (
        <form action={acceptInviteAction.bind(null, token)} className="mt-8">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Gabung ke pernikahan ini</button>
        </form>
      )}
    </div>
  );
}
