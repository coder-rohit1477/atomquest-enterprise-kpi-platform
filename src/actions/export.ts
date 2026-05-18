"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

function escapeCSV(val: string | number | null | undefined) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

export async function exportGoalsCSV() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = session.user as { id: string; role: string };
  const role = user.role;
  const userId = user.id;

  let goals = [];

  if (role === "ADMIN") {
    goals = await prisma.goal.findMany({
      include: { user: true, checkIns: true }
    });
  } else if (role === "MANAGER") {
    goals = await prisma.goal.findMany({
      where: {
        user: { managerId: userId }
      },
      include: { user: true, checkIns: true }
    });
  } else {
    goals = await prisma.goal.findMany({
      where: { userId },
      include: { user: true, checkIns: true }
    });
  }

  // Define CSV headers
  const headers = [
    "Goal ID", "Owner", "Title", "Thrust Area", "UOM", "Planned Target", "Weightage", "Status", "Actual Achievement", "Latest Progress %"
  ];

  const rows = goals.map(g => {
    const latestCheckIn = g.checkIns.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return [
      escapeCSV(g.id),
      escapeCSV(g.user.name || g.user.email),
      escapeCSV(g.title),
      escapeCSV(g.thrustArea),
      escapeCSV(g.uom),
      escapeCSV(g.target),
      escapeCSV(`${g.weightage}%`),
      escapeCSV(g.status),
      escapeCSV(""),
      escapeCSV(latestCheckIn ? `${latestCheckIn.progress}%` : "0%")
    ].join(",");
  });

  return [headers.map(escapeCSV).join(","), ...rows].join("\n");
}

export async function exportCheckInsCSV() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
  
    const user = session.user as { id: string; role: string };
    const role = user.role;
    const userId = user.id;
  
    let checkIns = [];
  
    if (role === "ADMIN") {
        checkIns = await prisma.quarterlyCheckIn.findMany({
            include: { goal: { include: { user: true } } }
        });
    } else if (role === "MANAGER") {
        checkIns = await prisma.quarterlyCheckIn.findMany({
            where: {
                goal: { user: { managerId: userId } }
            },
            include: { goal: { include: { user: true } } }
        });
    } else {
        checkIns = await prisma.quarterlyCheckIn.findMany({
            where: {
                goal: { userId }
            },
            include: { goal: { include: { user: true } } }
        });
    }
  
    const headers = [
      "CheckIn ID", "Goal", "Employee", "Quarter", "Year", "Planned Target", "Actual Achievement", "Progress %", "Status", "Accomplishments", "Challenges", "Next Steps"
    ];
  
    const rows = checkIns.map(c => [
        escapeCSV(c.id),
        escapeCSV(c.goal.title),
        escapeCSV(c.goal.user.name || c.goal.user.email),
        escapeCSV(`Q${c.quarter}`),
        escapeCSV(c.year),
        escapeCSV(c.goal.target),
        escapeCSV(""),
        escapeCSV(`${c.progress}%`),
        escapeCSV(c.status),
        escapeCSV(c.accomplishments),
        escapeCSV(c.challenges || ""),
        escapeCSV(c.nextSteps || "")
    ].join(","));
  
    return [headers.map(escapeCSV).join(","), ...rows].join("\n");
}
