"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GoalStatus } from "@prisma/client";
import { createNotification } from "./notifications";
import { createAuditLog } from "./audit";

const GoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Thrust area is required"),
  uom: z.string().min(1, "Unit of measurement is required"),
  target: z.coerce.number().min(1),
  weightage: z.coerce.number().min(1).max(100),
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
    if (existing && (existing.status === "APPROVED" || existing.status === "LOCKED")) {
      return { error: "Cannot edit an approved or locked goal." };
    }
    // Block core field edits if it's a child of a shared goal
    if (existing?.sharedGoalId) {
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

  const goal = await prisma.goal.upsert({
    where: { id: validated.id || "" },
    update: {
      ...validated,
      status: "DRAFT"
    },
    create: {
      ...validated,
      userId: session.user.id,
      status: "DRAFT"
    }
  });

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
  if (goal.status !== "DRAFT" && goal.status !== "REJECTED") return { error: "Only draft or rejected goals can be deleted." };

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
        "/manager/dashboard"
      );
    }
  });

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
        ...(updates?.target && { target: updates.target }),
        ...(updates?.weightage && { weightage: updates.weightage }),
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
    if (action === "APPROVE") {
      type = "SUCCESS";
      title = "Goal Approved";
    } else if (action === "REJECT") {
      type = "ERROR";
      title = "Goal Rejected";
    } else if (action === "REWORK") {
      type = "WARNING";
      title = "Rework Requested";
    }

    await createNotification(
      goal.userId,
      "Goal Approval Update",
      `Your strategic objective "${goal.title}" has been formally ${action.toLowerCase()}ed by management.`,
      type,
      "/dashboard/goals"
    );

    // Audit Log
    let auditAction = action === "APPROVE" ? "Goal Approved" : 
                      action === "REJECT" ? "Goal Rejected" : "Goal Update";
    await createAuditLog(auditAction, "GOAL", goalId, `Action by Manager for ${goal.user.name}`);
  });

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

