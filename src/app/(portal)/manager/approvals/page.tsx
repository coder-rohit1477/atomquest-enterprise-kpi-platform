import { redirect } from "next/navigation";

export default function ManagerApprovalsRedirectPage() {
  redirect("/manager/dashboard");
}
