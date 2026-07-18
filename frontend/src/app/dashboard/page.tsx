import { redirect } from "next/navigation";

export default function DashboardHomeRedirect() {
  redirect("/dashboard/sops");
}
