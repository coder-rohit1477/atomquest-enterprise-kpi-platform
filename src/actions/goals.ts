"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GoalStatus } from "@prisma/client";
import { createNotification } from "./notifications";
import { createAuditLog } from "./audit";
import {
  sendGoalApprovedEmail,
  sendGoalRejectedEmail,
  sendGoalSubmittedEmail,
} from "@/lib/email/send-email";

const GoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Thrust area is required"),
  uom: z.string().min(1, "Unit of measurement is required"),
  target: z.coerce.number().min(1),
  weightage: z.coerce.number().min(10, "Minimum weightage is 10%").max(100),
});

export async function getGoals() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      history: {
        orderBy: { createdAt: "desc" }
      },
      progressHistory: {
        orderBy: { createdAt: "desc" },
        take: 20,
      }
    }
  });
}

export async function upsertGoal(data: z.infer<typeof GoalSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = GoalSchema.parse(data);

  // If editing an existing goal, check if it's locked or shared-protected
  if (validated.id) {
    const existing = await prisma.goal.findUnique({ where: { id: validated.id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Goal not found or unauthorized." };
    }

    const isSharedChildGoal = Boolean(existing.sharedGoalId);
    if (existing.status === "LOCKED" && !isSharedChildGoal) {
      return { error: "Cannot edit a locked goal." };
    }
    if (isSharedChildGoal) {
      const isMetadataChanged = existing.title !== validated.title || 
                                 existing.description !== validated.description ||
                                 existing.thrustArea !== validated.thrustArea ||
                                 existing.uom !== validated.uom ||
                                 existing.target !== validated.target;
      
      if (isMetadataChanged) {
        return { error: "Core shared goal metadata cannot be modified by employees." };
      }
    }
  }

  // Check goal count limit (max 8)
  if (!validated.id) {
    const count = await prisma.goal.count({
      where: { userId: session.user.id }
    });
    if (count >= 8) {
      return { error: "Maximum of 8 goals allowed." };
    }
  }

  let goal;
  if (validated.id) {
    const existing = await prisma.goal.findUnique({ where: { id: validated.id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Goal not found or unauthorized." };
    }

    goal = await prisma.goal.update({
      where: { id: validated.id },
      data: {
        ...validated,
        status: existing.status,
      },
    });
  } else {
    goal = await prisma.goal.create({
      data: {
        ...validated,
        userId: session.user.id,
        status: "DRAFT",
      },
    });
  }

  // Audit Log
  await createAuditLog(
    validated.id ? "Goal Updated" : "Goal Created",
    "GOAL",
    goal.id,
    `Title: ${goal.title}`
  );

  revalidatePath("/dashboard/goals");
  return { success: true, data: goal };
}

export async function saveManagerReviewDraft(
  goalId: string,
  data: { comment?: string; target?: number; weightage?: number }
) {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  if (goal.user.managerId !== session.user.id) {
    throw new Error("Unauthorized access to employee goal");
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      managerComment: data.comment,
      ...(goal.status !== "LOCKED" && typeof data.target === "number" ? { target: data.target } : {}),
      ...(goal.status !== "LOCKED" && typeof data.weightage === "number" ? { weightage: Math.round(data.weightage) } : {}),
    },
  });

  await createAuditLog(
    "Manager Review Draft Saved",
    "GOAL",
    goalId,
    `Draft feedback saved for ${goal.user.name}`
  );

  revalidatePath("/manager/dashboard");
  revalidatePath("/dashboard/goals");
  return { success: true, data: updatedGoal };
}

// --- Shared Goal Actions ---

export async function createSharedGoal(data: z.infer<typeof GoalSchema>, employeeIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const validated = GoalSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    // 1. Create the Master Goal (Template)
    const masterGoal = await tx.goal.create({
      data: {
        ...validated,
        userId: session.user.id!,
        isShared: true,
        status: "APPROVED" // Master goals are automatically approved
      }
    });

    // 2. Create assignments and child goals for each employee
    for (const empId of employeeIds) {
      // Create Assignment record
      await tx.sharedGoalAssignment.create({
        data: {
          goalId: masterGoal.id,
          userId: empId
        }
      });

      // Create Individual Goal Instance for the Employee
      await tx.goal.create({
        data: {
          ...validated,
          userId: empId,
          isShared: true,
          sharedGoalId: masterGoal.id,
          status: "LOCKED" // Shared goals start as locked/approved for employees
        }
      });

      // Create History record
      await tx.approvalHistory.create({
        data: {
          goalId: masterGoal.id,
          fromStatus: "DRAFT",
          toStatus: "APPROVED",
          actionBy: session.user.id!,
          comment: `Shared goal assigned to employee ID: ${empId}`
        }
      });

      // Notify employee
      await createNotification(
        empId,
        "New Shared Goal Assigned",
        `A strategic shared goal "${masterGoal.title}" has been added to your portfolio.`,
        "INFO",
        "/dashboard/goals"
      );
    }

    // Audit Log
    await createAuditLog(
      "Shared Goal Created",
      "GOAL",
      masterGoal.id,
      `Title: ${masterGoal.title}, Assigned to: ${employeeIds.length} employees`
    );

    return { success: true, masterGoalId: masterGoal.id };
  });
}

export async function getSharedGoalsOverview() {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return await prisma.goal.findMany({
    where: { 
      userId: session.user.id,
      isShared: true,
      sharedGoalId: null // Only get master templates
    },
    include: {
      assignments: {
        include: {
          user: {
            include: {
              goals: {
                where: { isShared: true },
                include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } }
              }
            }
          }
        }
      }
    }
  });
}

export async function deleteGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found");
  if (goal.status === "LOCKED") return { error: "Locked goals cannot be deleted." };

  await prisma.goal.delete({ where: { id } });

  // Audit Log
  await createAuditLog("Goal Deleted", "GOAL", id, `Title: ${goal.title}`);
  
  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function submitGoals() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id }
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, managerId: true }
  });
  const manager = user?.managerId
    ? await prisma.user.findUnique({
        where: { id: user.managerId },
        select: { email: true, name: true },
      })
    : null;

  if (goals.length === 0) return { error: "No goals to submit." };

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage !== 100) {
    return { error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` };
  }

  const goalsToSubmit = goals.filter(g => g.status === "DRAFT" || g.status === "REJECTED");
  if (goalsToSubmit.length === 0) return { error: "No goals in draft or rejected state to submit." };

  await prisma.$transaction(async (tx) => {
    for (const goal of goalsToSubmit) {
      await tx.goal.update({
        where: { id: goal.id },
        data: { status: "PENDING_APPROVAL" }
      });

      await tx.approvalHistory.create({
        data: {
          goalId: goal.id,
          fromStatus: goal.status,
          toStatus: "PENDING_APPROVAL",
          actionBy: session.user.id!,
          comment: "Submitted for approval (Reworked)"
        }
      });

      // Audit Log
      await createAuditLog(
        goal.status === "REJECTED" ? "Goal Resubmitted" : "Goal Submitted",
        "GOAL",
        goal.id,
        `Title: ${goal.title}`
      );
    }

    if (user?.managerId) {
      await createNotification(
        user.managerId,
        "New Goals Submitted",
        `${user.name} has submitted goals for your review.`,
        "INFO",
        `/manager/dashboard?userId=${session.user.id}`
      );
    }
  });

  if (manager?.email) {
    try {
      const goalTitles = goalsToSubmit.map((goal) => goal.title).slice(0, 3).join(", ");
      await sendGoalSubmittedEmail({
        to: manager.email,
        recipientName: manager.name,
        goalTitle: goalTitles || "Strategic goals",
        actorName: user?.name || "An employee",
      });
    } catch (error) {
      console.error("[email] submitGoals notification failed:", error);
    }
  }

  revalidatePath("/dashboard/goals");
  return { success: true };
}

// --- Manager Actions ---

export async function getManagerQueue() {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  // Get employees under this manager
  const employees = await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goals: {
        include: {
          history: {
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  return employees.filter(emp => emp.goals.length > 0);
}

export async function handleManagerAction(
  goalId: string, 
  action: "APPROVE" | "REJECT" | "REWORK", 
  comment?: string,
  updates?: { target?: number, weightage?: number }
) {
  const session = await auth();
  if (!session?.user?.id || !["MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true }
  });

  if (!goal) throw new Error("Goal not found");
  if (goal.user.managerId !== session.user.id) throw new Error("Unauthorized access to employee goal");
  if (goal.status === "LOCKED") {
    return { error: "Locked goals cannot be modified." };
  }

  let toStatus: GoalStatus;
  if (action === "APPROVE") toStatus = "LOCKED"; // Requirement: Approved goals become locked
  else if (action === "REJECT") toStatus = "REJECTED";
  else toStatus = "DRAFT"; // Return for rework goes back to draft

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: goalId },
      data: { 
        status: toStatus,
        managerComment: comment,
        ...(typeof updates?.target === "number" ? { target: updates.target } : {}),
        ...(typeof updates?.weightage === "number" ? { weightage: Math.round(updates.weightage) } : {}),
      }
    });

    await tx.approvalHistory.create({
      data: {
        goalId: goalId,
        fromStatus: goal.status,
        toStatus: toStatus,
        actionBy: session.user.id!,
        comment: comment || `Goal ${action.toLowerCase()}ed by manager`
      }
    });

    // Create notification for employee
    let type = "INFO";
    let title = "Goal Update";
    let message = `Your strategic objective "${goal.title}" has been updated by management.`;
    if (action === "APPROVE") {
      type = "SUCCESS";
      title = "Goal Approved";
      message = `Your strategic objective "${goal.title}" has been approved and locked by management.`;
    } else if (action === "REJECT") {
      type = "ERROR";
      title = "Goal Rejected";
      message = `Your strategic objective "${goal.title}" has been rejected by management.`;
    } else if (action === "REWORK") {
      type = "WARNING";
      title = "Rework Requested";
      message = `Management requested rework for your strategic objective "${goal.title}".`;
    }

    await createNotification(
      goal.userId,
      title,
      message,
      type,
      "/dashboard/goals"
    );

    // Audit Log
    const auditAction = action === "APPROVE" ? "Goal Approved" : 
                       action === "REJECT" ? "Goal Rejected" : "Goal Update";
    await createAuditLog(auditAction, "GOAL", goalId, `Action by Manager for ${goal.user.name}`);
  });

  if (goal.user.email && (action === "APPROVE" || action === "REJECT")) {
    try {
      if (action === "APPROVE") {
        await sendGoalApprovedEmail({
          to: goal.user.email,
          recipientName: goal.user.name,
          goalTitle: goal.title,
          actorName: session.user.name || "Your manager",
        });
      } else {
        await sendGoalRejectedEmail({
          to: goal.user.email,
          recipientName: goal.user.name,
          goalTitle: goal.title,
          actorName: session.user.name || "Your manager",
        });
      }
    } catch (error) {
      console.error("[email] handleManagerAction notification failed:", error);
    }
  }

  revalidatePath("/manager/dashboard");
  revalidatePath("/dashboard/goals");
  return { success: true };
}

// --- Admin Actions ---

export async function unlockGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true }
  });

  if (!goal) throw new Error("Goal not found");

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: goalId },
      data: { status: "DRAFT" }
    });

    await tx.approvalHistory.create({
      data: {
        goalId: goalId,
        fromStatus: goal.status,
        toStatus: "DRAFT",
        actionBy: session.user.id!,
        comment: "Goal unlocked by Administrator for revision."
      }
    });

    await createNotification(
      goal.userId,
      "Goal Unlocked",
      `Administrator has unlocked your goal "${goal.title}" for revision.`,
      "WARNING",
      "/dashboard/goals"
    );

    // Audit Log
    await createAuditLog("Goal Unlocked", "GOAL", goalId, `Unlocked by Admin for ${goal.user.name}`);
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/manager/dashboard");
  revalidatePath("/reports");
  return { success: true };
}

