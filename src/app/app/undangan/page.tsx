import { InvitationEditor } from "@/components/invitation-editor";
import { PageHeader } from "@/components/chrome";
import { appUrl } from "@/lib/auth";
import { invitationShareText } from "@/lib/whatsapp";
import { requireWedding } from "@/lib/session";
import { formatLongDate } from "@/lib/utils";

export default async function InvitationPage() {
  const { wedding } = await requireWedding();
  const url = `${appUrl()}/i/${wedding.invitationSlug}`;
  return (
    <div>
      <PageHeader
        kicker="Undangan"
        title="Satu desain yang pantas dikirim"
        description="Pratinjau di kanan mengikuti isian. Tamu membuka tautan personal, RSVP-nya masuk ke daftar tamu."
      />
      <InvitationEditor
        wedding={{
          partnerAName: wedding.partnerAName,
          partnerBName: wedding.partnerBName,
          weddingDate: wedding.weddingDate,
          location: wedding.location,
          invitationSlug: wedding.invitationSlug,
          invitationStory: wedding.invitationStory,
          invitationCoverUrl: wedding.invitationCoverUrl,
          invitationPhoto2: wedding.invitationPhoto2,
          invitationPhoto3: wedding.invitationPhoto3,
          ceremonyTime: wedding.ceremonyTime,
          ceremonyVenue: wedding.ceremonyVenue,
          receptionTime: wedding.receptionTime,
          receptionVenue: wedding.receptionVenue,
          mapsUrl: wedding.mapsUrl,
          dressCode: wedding.dressCode,
          bankName: wedding.bankName,
          bankAccountName: wedding.bankAccountName,
          bankAccountNumber: wedding.bankAccountNumber,
          musicUrl: wedding.musicUrl,
        }}
        publicUrl={url}
        shareText={invitationShareText({
          guestName: "teman",
          partnerAName: wedding.partnerAName,
          partnerBName: wedding.partnerBName,
          url,
          dateLabel: formatLongDate(wedding.weddingDate),
          location: wedding.location,
        })}
      />
    </div>
  );
}
