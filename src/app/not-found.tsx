import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm text-primary">404</p>
        <h1 className="display mt-2 text-3xl">Halaman ini tidak ada</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mungkin tautannya usang, atau modulnya dipindah.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-primary">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
