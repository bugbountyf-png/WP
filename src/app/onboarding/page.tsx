import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.ownedWedding || user.partnerWedding) redirect("/app");
  return <OnboardingForm defaultName={user.name} />;
}
