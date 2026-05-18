import { redirect } from "next/navigation";

export default function ManagerSharedGoalsRedirectPage() {
  redirect("/manager/dashboard");
}
