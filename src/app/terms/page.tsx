import Link from "next/link";
import { Logo } from "@/components/logo";

export default function TermsPage() {
  return (
    <article className="gutter mx-auto max-w-2xl py-12">
      <Logo />
      <h1 className="display mt-10 text-4xl">Syarat penggunaan</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Buma adalah alat bantu perencanaan. Kamu bertanggung jawab atas keakuratan data tamu, pembayaran vendor, dan undangan yang kamu bagikan. Jangan memakai Buma untuk mengirim undangan tanpa izin penerima.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Backup database secara berkala. Foto yang diunggah tersimpan di server dan perlu ikut di-backup terpisah dari database.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/" className="text-primary">
          Kembali
        </Link>
      </p>
    </article>
  );
}
