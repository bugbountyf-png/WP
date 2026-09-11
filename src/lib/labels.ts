export const TASK_CATEGORIES = [
  "ADMINISTRATION",
  "MARRIAGE_REGISTRATION",
  "VENUE",
  "DECORATION",
  "DOWRY",
  "ATTIRE",
  "PHOTOGRAPHY",
  "CATERING",
  "INVITATION",
  "ENTERTAINMENT",
  "COMMITTEE",
  "LOGISTICS",
  "WEDDING_DAY",
  "OTHER",
] as const;

export const TASK_CATEGORY_LABELS: Record<(typeof TASK_CATEGORIES)[number], string> = {
  ADMINISTRATION: "Administrasi & perencanaan",
  MARRIAGE_REGISTRATION: "Pendaftaran nikah & bimbingan",
  VENUE: "Tempat",
  DECORATION: "Dekorasi",
  DOWRY: "Mahar & seserahan",
  ATTIRE: "Makeup & busana",
  PHOTOGRAPHY: "Dokumentasi",
  CATERING: "Makanan & katering",
  INVITATION: "Undangan & souvenir",
  ENTERTAINMENT: "Pengisi acara & hiburan",
  COMMITTEE: "Panitia & petugas",
  LOGISTICS: "Logistik",
  WEDDING_DAY: "Hari-H",
  OTHER: "Persiapan lainnya",
};

export const BUDGET_CATEGORIES = [
  "VENUE",
  "CATERING",
  "DECORATION",
  "WEDDING_ORGANIZER",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "PHOTOBOOTH",
  "WEDDING_CONTENT_CREATOR",
  "ATTIRE",
  "MAKEUP",
  "ENTERTAINMENT",
  "MC",
  "INVITATION",
  "SOUVENIR",
  "TRANSPORTATION",
  "WEDDING_CAR",
  "ACCOMMODATION",
  "ADMINISTRATION",
  "OTHER",
] as const;

export const BUDGET_CATEGORY_LABELS: Record<(typeof BUDGET_CATEGORIES)[number], string> = {
  VENUE: "Venue",
  CATERING: "Katering",
  DECORATION: "Dekorasi",
  WEDDING_ORGANIZER: "Wedding organizer",
  PHOTOGRAPHY: "Fotografi",
  VIDEOGRAPHY: "Videografi",
  PHOTOBOOTH: "Photobooth",
  WEDDING_CONTENT_CREATOR: "Content creator",
  ATTIRE: "Busana",
  MAKEUP: "Makeup",
  ENTERTAINMENT: "Hiburan",
  MC: "MC",
  INVITATION: "Undangan",
  SOUVENIR: "Souvenir",
  TRANSPORTATION: "Transportasi",
  WEDDING_CAR: "Sewa mobil pengantin",
  ACCOMMODATION: "Akomodasi",
  ADMINISTRATION: "Administrasi",
  OTHER: "Lainnya",
};

export const VENDOR_STATUSES = [
  "RESEARCHING",
  "CONTACTED",
  "NEGOTIATING",
  "BOOKED",
  "PAID",
  "CANCELLED",
] as const;

export const VENDOR_STATUS_LABELS: Record<(typeof VENDOR_STATUSES)[number], string> = {
  RESEARCHING: "Sedang riset",
  CONTACTED: "Sudah dihubungi",
  NEGOTIATING: "Negosiasi",
  BOOKED: "Booked",
  PAID: "Lunas",
  CANCELLED: "Batal",
};

export const GUEST_GROUPS = ["FAMILY", "FRIEND", "WORK", "OTHER"] as const;
export const GUEST_GROUP_LABELS: Record<(typeof GUEST_GROUPS)[number], string> = {
  FAMILY: "Keluarga",
  FRIEND: "Teman",
  WORK: "Kantor",
  OTHER: "Lainnya",
};

export const RSVP_LABELS = {
  PENDING: "Belum konfirmasi",
  CONFIRMED: "Hadir",
  DECLINED: "Tidak hadir",
} as const;

export const INVITE_STATUS_LABELS = {
  NOT_INVITED: "Belum diundang",
  INVITED: "Sudah diundang",
} as const;

export const SONG_MOMENTS = ["ENTRANCE", "AKAD", "FIRST_DANCE", "DINNER", "ENTERTAINMENT", "OTHER"] as const;
export const SONG_MOMENT_LABELS: Record<(typeof SONG_MOMENTS)[number], string> = {
  ENTRANCE: "Masuk pelaminan",
  AKAD: "Akad",
  FIRST_DANCE: "First dance",
  DINNER: "Jamuan",
  ENTERTAINMENT: "Hiburan",
  OTHER: "Lainnya",
};

export const SESERAHAN_CATEGORIES = [
  "CAIRAN",
  "MAKE_UP",
  "PERLENGKAPAN_MANDI",
  "MAKANAN",
  "IBADAH",
  "OTHER",
] as const;

export const SESERAHAN_CATEGORY_LABELS: Record<(typeof SESERAHAN_CATEGORIES)[number], string> = {
  CAIRAN: "Cairan & parfum",
  MAKE_UP: "Makeup",
  PERLENGKAPAN_MANDI: "Perlengkapan mandi",
  MAKANAN: "Makanan",
  IBADAH: "Ibadah",
  OTHER: "Lainnya",
};

export const SESERAHAN_STATUS_LABELS = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  PURCHASED: "Sudah dibeli",
} as const;

export const MEAL_PREFERENCES = ["STANDARD", "VEGETARIAN", "CHILD", "OTHER"] as const;
export const MEAL_LABELS: Record<(typeof MEAL_PREFERENCES)[number], string> = {
  STANDARD: "Menu biasa",
  VEGETARIAN: "Vegetarian",
  CHILD: "Menu anak",
  OTHER: "Lainnya / alergi",
};

export const WEEKDAY_SHORT = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"] as const;
