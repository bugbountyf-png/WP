import { startOfUtcDay, todayInApp } from "./utils";
import type { TASK_CATEGORIES } from "./labels";

type TaskTemplate = {
  title: string;
  description: string;
  category: (typeof TASK_CATEGORIES)[number];
  priority: "LOW" | "MEDIUM" | "HIGH";
  /** Target days before the wedding. Spread across the timeline instead of one dump. */
  daysBefore: number;
  tracks?: Array<"KUA" | "CATATAN_SIPIL" | "ALL">;
};

const SHARED: TaskTemplate[] = [
  { title: "Buka pos tabungan nikah", description: "Pisahkan dana pernikahan dari pengeluaran harian supaya progresnya kelihatan.", category: "ADMINISTRATION", priority: "HIGH", daysBefore: 240 },
  { title: "Tentukan total budget kasar", description: "Angka utuh dulu, nanti dipecah per pos di halaman budget.", category: "ADMINISTRATION", priority: "HIGH", daysBefore: 230 },
  { title: "Susun daftar tamu awal", description: "Perkiraan jumlah tamu menentukan ukuran venue dan biaya katering.", category: "ADMINISTRATION", priority: "HIGH", daysBefore: 220 },
  { title: "Bagi peran berdua", description: "Siapa urus vendor, siapa urus keluarga, siapa pegang uang. Ditulis, jangan cuma diobrolin.", category: "ADMINISTRATION", priority: "MEDIUM", daysBefore: 210 },
  { title: "Kumpulkan referensi suasana acara", description: "Warna, dekor, dress code. Satu folder bersama biar vendor tidak menebak.", category: "ADMINISTRATION", priority: "MEDIUM", daysBefore: 200 },
  { title: "Cari-cari venue", description: "Pilih tiga sampai lima tempat yang muat tamunya dan masuk budget.", category: "VENUE", priority: "HIGH", daysBefore: 210 },
  { title: "Survey venue unggulan", description: "Datang langsung, cek parkir, sound, dan cuaca cadangan.", category: "VENUE", priority: "HIGH", daysBefore: 180 },
  { title: "Booking venue", description: "Kunci tanggal sebelum season ramai. Simpan DP dan sisa pelunasan di budget.", category: "VENUE", priority: "HIGH", daysBefore: 160 },
  { title: "Cari wedding organizer", description: "Bandingkan tiga sampai lima nama. WO yang masuk lebih awal ikut membantu pilih vendor lain.", category: "COMMITTEE", priority: "HIGH", daysBefore: 200 },
  { title: "Booking wedding organizer", description: "Pastikan scope-nya jelas: full planning atau koordinator hari-H.", category: "COMMITTEE", priority: "HIGH", daysBefore: 150 },
  { title: "Riset vendor utama", description: "Venue, katering, dekor, dokumentasi. Masukkan kandidatnya di halaman Vendor, status riset.", category: "ADMINISTRATION", priority: "HIGH", daysBefore: 190 },
  { title: "Cari dekorator", description: "Bawa referensi suasana. Tanyakan paket pelaminan, backdrop, dan lighting.", category: "DECORATION", priority: "MEDIUM", daysBefore: 170 },
  { title: "Booking dekorasi", description: "Kunci konsep dan layout. Catat yang termasuk dan yang extra.", category: "DECORATION", priority: "HIGH", daysBefore: 120 },
  { title: "Cari katering", description: "Coba rasa, cek porsi per meja, dan opsi diet tamu.", category: "CATERING", priority: "HIGH", daysBefore: 160 },
  { title: "Booking katering", description: "Kunci menu, jumlah pax, dan jadwal tasting terakhir.", category: "CATERING", priority: "HIGH", daysBefore: 110 },
  { title: "Cari fotografer & videografer", description: "Lihat hasil acara yang mirip punya kalian, bukan cuma highlight.", category: "PHOTOGRAPHY", priority: "HIGH", daysBefore: 170 },
  { title: "Booking dokumentasi", description: "Tentukan jumlah crew, album, same-day edit, dan jam kerja.", category: "PHOTOGRAPHY", priority: "HIGH", daysBefore: 130 },
  { title: "Cari MUA dan wardrobe", description: "Trial makeup jauh-jauh hari. Busana akad dan resepsi bisa beda.", category: "ATTIRE", priority: "MEDIUM", daysBefore: 150 },
  { title: "Trial makeup", description: "Foto hasilnya di cahaya yang mirip venue. Revisi sebelum DP kedua.", category: "ATTIRE", priority: "MEDIUM", daysBefore: 70 },
  { title: "Fitting busana", description: "Fitting terakhir 2–3 minggu sebelum hari-H, termasuk sepatu dan aksesoris.", category: "ATTIRE", priority: "HIGH", daysBefore: 21 },
  { title: "Susun mahar", description: "Nilai, bentuk, dan siapa yang menyiapkan. Catat di seserahan kalau perlu.", category: "DOWRY", priority: "MEDIUM", daysBefore: 90 },
  { title: "Susun daftar seserahan", description: "Isi nampan, siapa belanja, dan budget per item.", category: "DOWRY", priority: "MEDIUM", daysBefore: 80 },
  { title: "Beli seserahan", description: "Selesaikan belanja 2 minggu sebelumnya supaya tidak mepet packing.", category: "DOWRY", priority: "HIGH", daysBefore: 14 },
  { title: "Desain undangan digital", description: "Isi foto, cerita, peta, dan rekening di halaman Undangan. Pratinjau harus pantas dikirim lewat WhatsApp.", category: "INVITATION", priority: "HIGH", daysBefore: 90 },
  { title: "Isi daftar tamu final", description: "Nama, pax, sisi keluarga, dan status undangan. Ini yang nentuin kursi.", category: "INVITATION", priority: "HIGH", daysBefore: 75 },
  { title: "Kirim undangan", description: "Bagikan tautan personal. Tandai tamu yang sudah diundang.", category: "INVITATION", priority: "HIGH", daysBefore: 45 },
  { title: "Follow-up RSVP", description: "Yang belum konfirmasi dihubungi lagi. Angka hadir menyesuaikan katering.", category: "INVITATION", priority: "HIGH", daysBefore: 14 },
  { title: "Cari hiburan / MC", description: "MC, band, atau DJ. Sesuaikan dengan rundown dan karakter tamu.", category: "ENTERTAINMENT", priority: "MEDIUM", daysBefore: 100 },
  { title: "Booking pengisi acara", description: "Kunci setlist kasar dan kebutuhan sound.", category: "ENTERTAINMENT", priority: "MEDIUM", daysBefore: 70 },
  { title: "Susun playlist hari-H", description: "Masuk pelaminan, akad, jamuan, hiburan. Simpan di halaman Hari-H.", category: "ENTERTAINMENT", priority: "MEDIUM", daysBefore: 21 },
  { title: "Susun rundown jam per jam", description: "Isi halaman Hari-H: jam, lokasi, PIC. Kirim ke vendor dan keluarga.", category: "WEDDING_DAY", priority: "HIGH", daysBefore: 30 },
  { title: "Brief vendor hari-H", description: "Kirim rundown, denah, kontak PIC, dan jam load-in.", category: "WEDDING_DAY", priority: "HIGH", daysBefore: 10 },
  { title: "Packing barang hari-H", description: "Dokumen, cincin, seserahan, spare makeup, uang cash vendor.", category: "LOGISTICS", priority: "HIGH", daysBefore: 3 },
  { title: "Konfirmasi transportasi pengantin", description: "Mobil, rute, dan waktu jemput. Cadangan kalau macet.", category: "LOGISTICS", priority: "MEDIUM", daysBefore: 14 },
  { title: "Cek pelunasan vendor", description: "Semua sisa tagihan terlihat di Budget. Jangan ada yang kelewat di minggu terakhir.", category: "ADMINISTRATION", priority: "HIGH", daysBefore: 10 },
  { title: "Souvenir dan welcome desk", description: "Jumlah souvenir = tamu konfirmasi + cadangan kecil.", category: "INVITATION", priority: "LOW", daysBefore: 14 },
  { title: "Tentukan dress code tamu", description: "Tulis di undangan supaya tamu tidak menebak.", category: "INVITATION", priority: "LOW", daysBefore: 60 },
  { title: "Siapkan PIC keluarga", description: "Satu orang per sisi yang bisa dihubungi vendor tanpa mengganggu kalian.", category: "COMMITTEE", priority: "MEDIUM", daysBefore: 21 },
  { title: "Cetak rundown & kontak darurat", description: "Versi kertas untuk MC, WO, dan orang tua.", category: "WEDDING_DAY", priority: "MEDIUM", daysBefore: 5 },
  { title: "Istirahat seminggu sebelumnya", description: "Jangan masukkan kerjaan baru. Tubuh kalian juga bagian dari acara.", category: "WEDDING_DAY", priority: "LOW", daysBefore: 7 },
];

const KUA: TaskTemplate[] = [
  { title: "Urus surat N1–N4 di kelurahan", description: "Untuk pernikahan Islam lewat KUA. Mulai dari kelurahan masing-masing.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 90, tracks: ["KUA"] },
  { title: "Daftar Simkah / KUA", description: "Pilih KUA tempat akad. Bawa berkas lengkap dan foto.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 60, tracks: ["KUA"] },
  { title: "Ikuti bimbingan perkawinan", description: "Jadwal bimwin biasanya wajib sebelum akad. Catat tanggalnya di kalender.", category: "MARRIAGE_REGISTRATION", priority: "MEDIUM", daysBefore: 40, tracks: ["KUA"] },
  { title: "Cek wali dan saksi", description: "Nama wali, saksi, dan mahar harus sudah final sebelum akad.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 14, tracks: ["KUA"] },
];

const SIPIL: TaskTemplate[] = [
  { title: "Siapkan berkas Catatan Sipil", description: "KTP, KK, akta lahir, dan surat belum menikah. Cek persyaratan dukcapil setempat.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 90, tracks: ["CATATAN_SIPIL"] },
  { title: "Daftar pencatatan sipil", description: "Ambil nomor antrean dan pastikan kedua belah pihak hadir sesuai jadwal.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 50, tracks: ["CATATAN_SIPIL"] },
  { title: "Ambil kutipan akta perkawinan", description: "Simpan salinan digital dan fisik. Ini dokumen yang dipakai mengurus nama di KK.", category: "MARRIAGE_REGISTRATION", priority: "HIGH", daysBefore: 7, tracks: ["CATATAN_SIPIL"] },
];

export const KUA_TASK_TITLES = KUA.map((task) => task.title);
export const SIPIL_TASK_TITLES = SIPIL.map((task) => task.title);
export const DOWRY_TASK_TITLES = SHARED.filter((task) => task.category === "DOWRY").map((task) => task.title);
export const OPEN_GUEST_TASK = "Siapkan alur tamu terbuka";
export const CLOSED_GUEST_TASK = "Kunci daftar tamu tertutup";

export function buildChecklist(input: {
  weddingDate: Date;
  marriageTrack: "KUA" | "CATATAN_SIPIL";
  weddingType: "PRIVATE" | "OPEN";
}) {
  const extras =
    input.weddingType === "OPEN"
      ? [
          {
            title: OPEN_GUEST_TASK,
            description: "Karena acaranya terbuka, tentukan jam ramai, welcome drink, dan siapa jaga meja undangan.",
            category: "LOGISTICS" as const,
            priority: "MEDIUM" as const,
            daysBefore: 30,
          },
        ]
      : [
          {
            title: CLOSED_GUEST_TASK,
            description: "Acara tertutup: tamu di luar daftar tidak masuk. Security dan welcome desk harus satu suara.",
            category: "INVITATION" as const,
            priority: "HIGH" as const,
            daysBefore: 21,
          },
        ];

  const catalog = [
    ...SHARED.filter((task) => input.marriageTrack === "KUA" || task.category !== "DOWRY"),
    ...(input.marriageTrack === "KUA" ? KUA : SIPIL),
    ...extras,
  ];
  const today = startOfUtcDay(todayInApp());
  const wedding = startOfUtcDay(input.weddingDate);
  const remaining = Math.max(14, Math.round((wedding.getTime() - today.getTime()) / 86_400_000));

  return catalog.map((task, index) => {
    const desired = Math.min(task.daysBefore, remaining - 2);
    const daysBefore = Math.max(3, desired);
    const due = new Date(wedding.getTime() - daysBefore * 86_400_000);
    // Stagger tasks that would otherwise land on the same day.
    const stagger = index % 3;
    due.setUTCDate(due.getUTCDate() + stagger);
    if (due.getTime() <= today.getTime()) {
      due.setTime(today.getTime() + (4 + (index % 5)) * 86_400_000);
    }
    if (due.getTime() >= wedding.getTime()) {
      due.setTime(wedding.getTime() - 2 * 86_400_000);
    }
    return {
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: due,
    };
  });
}
