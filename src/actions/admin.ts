"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await prisma.user.findMany({
    include: {
      manager: true,
      _count: {
        select: { goals: true }
      }
    },
    orderBy: { name: "asc" }
  });
}

export async function updateUserRole(userId: string, role: "EMPLOYEE" | "MANAGER" | "ADMIN") {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function assignManager(employeeId: string, managerId: string | null) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: employeeId },
    data: { managerId }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getTeam() {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });
}
