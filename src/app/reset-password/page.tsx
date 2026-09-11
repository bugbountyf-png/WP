import { ResetForm } from "@/components/auth-forms";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return <p className="p-10 text-center text-sm">Tautan resetnya tidak lengkap. Minta yang baru dari halaman lupa password.</p>;
  }
  return <ResetForm token={token} />;
}
