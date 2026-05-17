"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  details?: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "SYSTEM";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
      },
    });
  } catch (error) {
    // Audit logging failures must NEVER crash app flows
    console.error("Audit log creation failed:", error);
  }
}

export async function getAuditLogs() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const userIds = Array.from(new Set(logs.map(l => l.userId).filter(id => id !== "SYSTEM")));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u.name || u.email]));

  return logs.map(log => ({
    ...log,
    userName: log.userId === "SYSTEM" ? "System" : (userMap[log.userId] || log.userId)
  }));
}
