"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CheckInStatus } from "@prisma/client";
import { createNotification } from "./notifications";
import { createAuditLog } from "./audit";

const CheckInSchema = z.object({
  goalId: z.string(),
  quarter: z.number().min(1).max(4),
  year: z.number(),
  progress: z.number().min(0).max(100),
  actualAchievement: z.number().optional(),
  accomplishments: z.string().min(10, "Please provide more details about your accomplishments"),
  challenges: z.string().optional(),
  nextSteps: z.string().optional(),
  status: z.nativeEnum(CheckInStatus),
});

const CHECK_IN_WINDOWS: Record<number, { months: readonly number[]; label: string }> = {
  1: { months: [7, 8, 9], label: "July to September" },
  2: { months: [10, 11, 12], label: "October to December" },
  3: { months: [1, 2, 3], label: "January to March" },
  4: { months: [3, 4], label: "March to April" },
};

export async function submitCheckIn(data: z.infer<typeof CheckInSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = CheckInSchema.parse(data);

  const goal = await prisma.goal.findUnique({
    where: { id: validated.goalId },
    include: { user: true }
  });

  if (!goal || goal.userId !== session.user.id) {
    throw new Error("Goal not found or unauthorized");
  }

  if (goal.status !== "APPROVED" && goal.status !== "LOCKED") {
    return { error: "Check-ins are only allowed for approved or locked goals." };
  }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const activeWindow = CHECK_IN_WINDOWS[validated.quarter];
  if (!activeWindow.months.includes(month)) {
    return {
      error: `Q${validated.quarter} check-ins can only be submitted during ${activeWindow.label}.`,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create or update check-in
    const checkIn = await tx.quarterlyCheckIn.upsert({
      where: {
        goalId_quarter_year: {
          goalId: validated.goalId,
          quarter: validated.quarter,
          year: validated.year,
        }
      },
      update: {
        progress: validated.progress,
        accomplishments: validated.accomplishments,
        challenges: validated.challenges,
        nextSteps: validated.nextSteps,
        status: validated.status,
      },
      create: {
        ...validated,
      }
    });

    // Record progress history
    await tx.progressHistory.create({
      data: {
        goalId: validated.goalId,
        progress: validated.progress,
        status: validated.status,
        updatedBy: session.user.id!,
      }
    });

    // --- BRD Requirement: Sync Shared Goal Achievement (Section 2.1) ---
    // "Achievement updates by the primary owner sync across all linked goal sheets"
    if (goal.isShared && !goal.sharedGoalId) {
       // This is the primary owner (Master Template)
       const linkedGoals = await tx.goal.findMany({
         where: { sharedGoalId: goal.id }
       });

       for (const linked of linkedGoals) {
         await tx.quarterlyCheckIn.upsert({
           where: {
             goalId_quarter_year: {
               goalId: linked.id,
               quarter: validated.quarter,
               year: validated.year,
             }
           },
           update: {
             progress: validated.progress,
             status: validated.status,
             accomplishments: `Synced from Shared Goal Owner: ${validated.accomplishments}`,
           },
           create: {
             goalId: linked.id,
             quarter: validated.quarter,
             year: validated.year,
             progress: validated.progress,
             status: validated.status,
             accomplishments: `Synced from Shared Goal Owner: ${validated.accomplishments}`,
           }
         });
       }
    }

    // Audit Log
    await createAuditLog(
      "Check-In Submitted",
      "CHECK_IN",
      checkIn.id,
      `Goal: ${goal.title}, Q${validated.quarter} ${validated.year}`
    );

    // Notify manager
    if (goal.user.managerId) {
      await createNotification(
        goal.user.managerId,
        "New Check-In Submitted",
        `${goal.user.name} submitted a check-in for "${goal.title}" (Q${validated.quarter} ${validated.year})`,
        "INFO",
        `/manager/check-ins`
      );
    }

    return checkIn;
  });

  revalidatePath("/dashboard/check-ins");
  revalidatePath("/manager/check-ins");
  return { success: true, data: result };
}

export async function getEmployeeCheckIns() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.goal.findMany({
    where: { userId: session.user.id, status: { in: ["APPROVED", "LOCKED"] } },
    include: {
      checkIns: {
        include: {
          managerFeedback: true
        },
        orderBy: [{ year: "desc" }, { quarter: "desc" }]
      },
      progressHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function getManagerCheckInQueue() {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goals: {
        where: { status: { in: ["APPROVED", "LOCKED"] } },
        include: {
          checkIns: {
            include: {
              managerFeedback: true
            },
            orderBy: [{ year: "desc" }, { quarter: "desc" }]
          }
        }
      }
    }
  });
}

export async function addManagerFeedback(data: {
  checkInId: string,
  comment: string,
  isConcern: boolean,
  requestUpdate: boolean
}) {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const checkIn = await prisma.quarterlyCheckIn.findUnique({
    where: { id: data.checkInId },
    include: { goal: { include: { user: true } } }
  });

  if (!checkIn) throw new Error("Check-in not found");
  if (checkIn.goal.user.managerId !== session.user.id) throw new Error("Unauthorized");

  const feedback = await prisma.$transaction(async (tx) => {
    const fb = await tx.managerFeedback.upsert({
      where: { checkInId: data.checkInId },
      update: {
        comment: data.comment,
        isConcern: data.isConcern,
        requestUpdate: data.requestUpdate,
      },
      create: {
        checkInId: data.checkInId,
        comment: data.comment,
        isConcern: data.isConcern,
        requestUpdate: data.requestUpdate,
        managerId: session.user.id!,
      }
    });

    // Notify employee
    let type = "INFO";
    let title = "Check-In Review";
    if (data.isConcern) {
        type = "WARNING";
        title = "Strategic Concern Flagged";
    } else if (data.requestUpdate) {
        type = "ERROR";
        title = "Action Required: Check-In Update";
    }

    await createNotification(
      checkIn.goal.userId,
      title,
      `Your manager has provided formal feedback on your Q${checkIn.quarter} check-in for "${checkIn.goal.title}".`,
      type,
      "/dashboard/check-ins"
    );

    // Audit Log
    await createAuditLog(
      "Manager Feedback Added",
      "CHECK_IN_FEEDBACK",
      fb.id,
      `Check-In Q${checkIn.quarter} for ${checkIn.goal.user.name}`
    );

    return fb;
  });

  revalidatePath("/dashboard/check-ins");
  revalidatePath("/manager/check-ins");
  return { success: true, data: feedback };
}

export async function getTeamAnalytics() {
    const session = await auth();
    if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const employees = await prisma.user.findMany({
        where: { managerId: session.user.id },
        include: {
            goals: {
                where: { status: { in: ["APPROVED", "LOCKED"] } },
                include: {
                    checkIns: {
                        orderBy: [{ year: "desc" }, { quarter: "desc" }],
                        take: 1
                    }
                }
            }
        }
    });

    // Status distribution
    const statusCounts: Record<string, number> = {
        ON_TRACK: 0,
        AT_RISK: 0,
        DELAYED: 0,
        COMPLETED: 0,
        NO_CHECK_IN: 0
    };

    let totalProgress = 0;
    let goalCount = 0;

    employees.forEach(emp => {
        emp.goals.forEach(goal => {
            goalCount++;
            if (goal.checkIns.length > 0) {
                const latest = goal.checkIns[0];
                statusCounts[latest.status]++;
                totalProgress += latest.progress;
            } else {
                statusCounts["NO_CHECK_IN"]++;
            }
        });
    });

    const avgProgress = goalCount > 0 ? totalProgress / goalCount : 0;

    return {
        statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        avgProgress,
        totalGoals: goalCount,
        delayedGoals: statusCounts["DELAYED"] + statusCounts["AT_RISK"],
        pendingReviews: statusCounts["NO_CHECK_IN"]
    };
}
