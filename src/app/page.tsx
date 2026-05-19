import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;

  if (session) {
    if (role === "ADMIN") {
      redirect("/admin");
    }
    if (role === "MANAGER") {
      redirect("/manager/dashboard");
    }
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
