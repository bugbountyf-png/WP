import { redirect } from "next/navigation";

export default function TabunganRedirect() {
  redirect("/app/budget?tab=tabungan");
}
