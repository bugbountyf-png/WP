export type GuestHeadcount = {
  pax: number;
  plusOneAllowed?: boolean;
  plusOneName?: string | null;
  rsvpStatus: string;
};

export function guestSeats(guest: GuestHeadcount, kind: "listed" | "confirmed" = "listed") {
  if (guest.rsvpStatus === "DECLINED") return 0;
  if (kind === "confirmed" && guest.rsvpStatus !== "CONFIRMED") return 0;
  let seats = Math.max(0, guest.pax);
  if ((guest.plusOneAllowed || guest.plusOneName) && seats < 2) seats = 2;
  return seats;
}

export function withPlusOnePax(pax: number, plusOneAllowed: boolean, plusOneName: string | null) {
  const next = Math.max(1, pax);
  if ((plusOneAllowed || plusOneName) && next < 2) return 2;
  return next;
}
