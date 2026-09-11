import Link from "next/link";

export default function ExpiredInvitePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="display text-3xl">Undangan sudah tidak berlaku</h1>
        <p className="mt-3 text-sm text-muted-foreground">Minta tautan baru dari pasanganmu di halaman pengaturan.</p>
        <Link href="/login" className="mt-6 inline-block text-sm text-primary">
          Masuk
        </Link>
      </div>
    </div>
  );
}
