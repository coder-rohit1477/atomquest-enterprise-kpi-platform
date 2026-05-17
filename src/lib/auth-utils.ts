import { auth } from "@/auth";

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user as { id: string; role: string; name?: string | null; email?: string | null } | undefined;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function isManager() {
  const user = await getCurrentUser();
  return user?.role === "MANAGER" || user?.role === "ADMIN";
}
