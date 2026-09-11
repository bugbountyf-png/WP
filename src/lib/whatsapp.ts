export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function whatsappHref(phone: string | null | undefined, text: string) {
  const msg = encodeURIComponent(text);
  const number = phone ? toWhatsAppNumber(phone) : "";
  return number ? `https://wa.me/${number}?text=${msg}` : `https://wa.me/?text=${msg}`;
}

export function invitationShareText(input: {
  guestName: string;
  partnerAName: string;
  partnerBName: string;
  url: string;
  dateLabel: string;
  location: string;
}) {
  return `Halo ${input.guestName}, kami mengundang kamu ke pernikahan ${input.partnerAName} & ${input.partnerBName} pada ${input.dateLabel} di ${input.location}.\n\nBuka undangannya di sini:\n${input.url}`;
}
