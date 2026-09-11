import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation-view";
import { RsvpForm } from "@/components/rsvp-form";
import { prisma } from "@/lib/prisma";

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; untuk?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const wedding = await prisma.wedding.findUnique({ where: { invitationSlug: slug } });
  if (!wedding) notFound();
  const guest = query.t
    ? await prisma.guest.findFirst({ where: { weddingId: wedding.id, inviteToken: query.t } })
    : query.untuk
      ? await prisma.guest.findFirst({ where: { weddingId: wedding.id, name: query.untuk } })
      : null;
  const guestName = guest?.name ?? query.untuk ?? null;

  return (
    <div className="min-h-dvh bg-[#f7f3ec]">
      <div className="mx-auto max-w-lg pb-16">
        <InvitationView wedding={wedding} guestName={guestName} />
        <div className="px-6">
          <RsvpForm slug={slug} guestName={guestName} token={guest?.inviteToken} />
          <p className="mt-8 text-center text-xs text-[#6b5e52]">Dibuat di Buma Wedding Planner</p>
        </div>
      </div>
    </div>
  );
}
