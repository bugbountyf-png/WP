import Link from "next/link";
import { Logo } from "@/components/logo";

const modules = [
  { title: "Dashboard", body: "Sisa hari, tugas, biaya, dan tamu dalam satu layar." },
  { title: "Checklist", body: "Cari, filter, dan centang puluhan tugas yang tersebar ke tanggal yang masuk akal." },
  { title: "Kalender", body: "Grid bulan, agenda hari itu, dan yang berikutnya. Bisa di-export ke kalender HP." },
  { title: "Budget", body: "Plafon, alokasi, aktual, sudah dibayar, sisa pelunasan, dan tabungan — satu layar." },
  { title: "Vendor", body: "Riset, negosiasi, booked, lunas. Yang sudah harga bisa langsung tercatat di budget." },
  { title: "Tamu", body: "Plus-one, menu, alergi, alamat, impor CSV, WhatsApp, RSVP, dan denah meja." },
  { title: "Undangan", body: "Satu desain rapi: foto, nama tamu, peta, rekening, RSVP yang mengisi daftar tamu." },
  { title: "Hari-H", body: "Rundown PDF untuk WO/MC/orang tua, plus playlist di halaman yang sama." },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="gutter flex items-center justify-between py-5">
        <Logo size="lg" />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Masuk
          </Link>
          <Link href="/register" className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground">
            Mulai rencanakan
          </Link>
        </div>
      </header>

      <section className="gutter relative overflow-hidden pb-20 pt-10 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-80 bg-[radial-gradient(60%_100%_at_20%_0%,var(--color-tone-teal-soft),transparent_70%)]" />
        <p className="text-sm font-medium text-primary">Wedding Planner</p>
        <h1 className="display mt-3 max-w-3xl text-4xl leading-tight sm:text-6xl">
          Bantu kamu merencanakan semuanya sampai Hari-H
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Tamu, uang, dan waktu dalam satu tempat. Undangan digital yang pantas dikirim lewat WhatsApp, rundown yang bisa dicetak, kalender yang kelihatan seperti kalender. Semua fitur terbuka. Tidak ada paket berbayar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
            Mulai rencanakan
          </Link>
          <a href="#fitur" className="rounded-lg border border-border px-5 py-3 text-sm font-medium">
            Lihat yang termasuk
          </a>
        </div>
      </section>

      <section className="gutter pb-16">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Harga vendor tersimpan di chat. Budget di spreadsheet. Daftar tamu di catatan. Semuanya terpisah, dan yang terlewat biasanya baru terasa ketika waktunya sudah mepet. Buma merapikannya ke satu tempat.
        </p>
      </section>

      <section id="fitur" className="gutter grid scroll-mt-20 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => (
          <article key={item.title} className="surface p-5">
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="gutter pb-20">
        <h2 className="display text-3xl">Undangan yang bisa dibagikan</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Satu desain, tautan personal per tamu, foto, peta, rekening, dan RSVP yang langsung mengisi daftar tamu. Bukan lima kulit kosong.
        </p>
      </section>

      <section className="gutter pb-20">
        <h2 className="display text-3xl">Semua fitur, tanpa langganan</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Vendor, tamu, pembayaran, rundown PDF, seserahan untuk jalur KUA, dan undangan digital. Tidak ada paywall.
        </p>
        <ul className="mt-6 grid gap-2 text-sm">
          <li>Kalender bulan dengan export iCal</li>
          <li>Daftar tamu, CSV, WhatsApp, seating, RSVP</li>
          <li>Budget, pelunasan, dan tabungan di satu layar</li>
          <li>Rundown hari-H siap cetak PDF</li>
          <li>Undang pasangan ke data yang sama</li>
        </ul>
        <Link href="/register" className="mt-8 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
          Bikin akun
        </Link>
      </section>

      <section className="gutter pb-24">
        <h2 className="display text-3xl">Yang biasanya ditanyakan</h2>
        <dl className="mt-8 grid max-w-2xl gap-6">
          <div>
            <dt className="font-medium">Ini langganan bulanan?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Bukan. Versi ini semua fiturnya terbuka. Tidak ada tagihan.</dd>
          </div>
          <div>
            <dt className="font-medium">Undangan digitalnya beneran termasuk?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Termasuk. Satu desain yang bisa diisi foto, peta, dan rekening, lalu dikirim per tamu lewat WhatsApp.</dd>
          </div>
          <div>
            <dt className="font-medium">Bisa dipakai berdua sama pasangan?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Bisa. Undang pasangan dari pengaturan. Dia masuk ke data pernikahan yang sama.</dd>
          </div>
          <div>
            <dt className="font-medium">Kalau tanggalnya berubah?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Ganti di pengaturan. Hitung mundur dan pengingat menyesuaikan. Tenggat checklist mengikuti jarak ke hari-H, tidak menumpuk di satu hari.</dd>
          </div>
        </dl>
      </section>

      <footer className="gutter flex flex-wrap gap-4 border-t border-border py-8 text-sm text-muted-foreground">
        <span>Buma</span>
        <Link href="/privacy">Privasi</Link>
        <Link href="/terms">Syarat</Link>
        <Link href="/login">Masuk</Link>
        <Link href="/register">Daftar</Link>
      </footer>
    </div>
  );
}
