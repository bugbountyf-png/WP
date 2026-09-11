import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.ownedWedding || user?.partnerWedding) redirect("/app");
  if (user) redirect("/onboarding");
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
