export type InvitationData = {
  partnerAName: string;
  partnerBName: string;
  weddingDate: Date | string;
  location: string;
  invitationStory: string | null;
  invitationCoverUrl: string | null;
  invitationPhoto2: string | null;
  invitationPhoto3: string | null;
  ceremonyTime: string | null;
  ceremonyVenue: string | null;
  receptionTime: string | null;
  receptionVenue: string | null;
  mapsUrl: string | null;
  dressCode: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  musicUrl: string | null;
};

export function mapsEmbedUrl(location: string, mapsUrl?: string | null) {
  if (mapsUrl?.includes("google.com/maps/embed")) return mapsUrl;
  const query = encodeURIComponent(location);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

export function guestInvitePath(slug: string, token?: string | null, name?: string | null) {
  const params = new URLSearchParams();
  if (token) params.set("t", token);
  else if (name) params.set("untuk", name);
  const query = params.toString();
  return query ? `/i/${slug}?${query}` : `/i/${slug}`;
}
