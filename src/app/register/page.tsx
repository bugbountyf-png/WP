import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.ownedWedding || user?.partnerWedding) redirect("/app");
  if (user) redirect("/onboarding");
  const { next } = await searchParams;
  return <RegisterForm next={next} />;
}
