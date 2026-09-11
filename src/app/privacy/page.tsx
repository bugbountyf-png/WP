import Link from "next/link";
import { Logo } from "@/components/logo";

export default function PrivacyPage() {
  return (
    <article className="gutter mx-auto max-w-2xl py-12">
      <Logo />
      <h1 className="display mt-10 text-4xl">Kebijakan privasi</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Buma menyimpan data yang kamu isi untuk merencanakan pernikahan: nama, email, tanggal, lokasi, daftar tamu, vendor, dan catatan keuangan. Data itu milik kamu dan pasangan yang kamu undang. Kami tidak menjualnya.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Data disimpan di database PostgreSQL milik aplikasi. Jangan unggah data tamu ke server publik tanpa persetujuan mereka.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/" className="text-primary">
          Kembali
        </Link>
      </p>
    </article>
  );
}
