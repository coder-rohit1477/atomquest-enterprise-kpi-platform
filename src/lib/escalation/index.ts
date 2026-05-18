import prisma from "@/lib/prisma";
import type { EscalationRunStats, EscalationType } from "./types";

const MANAGER_APPROVAL_OVERDUE_DAYS = 7;
const GOALS_NOT_SUBMITTED_GRACE_DAYS = 21;

function getCurrentQuarterAndYear(now: Date) {
  const month = now.getUTCMonth() + 1;
  const quarter = Math.floor((month - 1) / 3) + 1;
  const year = now.getUTCFullYear();
  return { quarter, year };
}

function getStartOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getCurrentQuarterStartUtc(now: Date) {
  const { quarter, year } = getCurrentQuarterAndYear(now);
  const startMonth = (quarter - 1) * 3;
  return new Date(Date.UTC(year, startMonth, 1));
}

async function createEscalationOncePerDay(params: {
  employeeId: string;
  escalationType: EscalationType;
  level: number;
  message: string;
  now: Date;
}) {
  const todayStart = getStartOfUtcDay(params.now);
  const existing = await prisma.escalationLog.findFirst({
    where: {
      employeeId: params.employeeId,
      escalationType: params.escalationType,
      level: params.level,
      createdAt: { gte: todayStart },
    },
    select: { id: true },
  });

  if (existing) {
    return false;
  }

  await prisma.escalationLog.create({
    data: {
      employeeId: params.employeeId,
      escalationType: params.escalationType,
      level: params.level,
      message: params.message,
    },
  });
  return true;
}

async function checkGoalsNotSubmitted(now: Date) {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: {
      id: true,
      goals: {
        select: { id: true, status: true, createdAt: true },
      },
    },
  });

  const quarterStart = getCurrentQuarterStartUtc(now);
  const graceCutoff = new Date(quarterStart);
  graceCutoff.setUTCDate(graceCutoff.getUTCDate() + GOALS_NOT_SUBMITTED_GRACE_DAYS);

  let created = 0;
  for (const employee of employees) {
    const hasSubmittedGoals = employee.goals.some(
      (g) => g.status !== "DRAFT" && g.status !== "REJECTED"
    );
    const hasAnyGoal = employee.goals.length > 0;
    const shouldEscalate = now >= graceCutoff && (!hasAnyGoal || !hasSubmittedGoals);

    if (!shouldEscalate) continue;

    const didCreate = await createEscalationOncePerDay({
      employeeId: employee.id,
      escalationType: "GOALS_NOT_SUBMITTED",
      level: 1,
      message: "Employee has not submitted goals for the active cycle.",
      now,
    });
    if (didCreate) created++;
  }
  return { scanned: employees.length, created };
}

async function checkManagerApprovalOverdue(now: Date) {
  const overdueCutoff = new Date(now);
  overdueCutoff.setUTCDate(overdueCutoff.getUTCDate() - MANAGER_APPROVAL_OVERDUE_DAYS);

  const goals = await prisma.goal.findMany({
    where: {
      status: "PENDING_APPROVAL",
      updatedAt: { lte: overdueCutoff },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      updatedAt: true,
    },
  });

  let created = 0;
  for (const goal of goals) {
    const didCreate = await createEscalationOncePerDay({
      employeeId: goal.userId,
      escalationType: "MANAGER_APPROVAL_OVERDUE",
      level: 2,
      message: `Manager approval overdue for goal "${goal.title}".`,
      now,
    });
    if (didCreate) created++;
  }
  return { scanned: goals.length, created };
}

async function checkQuarterlyCheckInOverdue(now: Date) {
  const { quarter, year } = getCurrentQuarterAndYear(now);
  const quarterEnd = new Date(Date.UTC(year, quarter * 3, 0, 23, 59, 59));
  if (now <= quarterEnd) {
    return { scanned: 0, created: 0 };
  }

  const goals = await prisma.goal.findMany({
    where: {
      status: { in: ["APPROVED", "LOCKED"] },
    },
    select: {
      id: true,
      title: true,
      userId: true,
      checkIns: {
        where: { quarter, year },
        select: { id: true },
        take: 1,
      },
    },
  });

  let created = 0;
  for (const goal of goals) {
    if (goal.checkIns.length > 0) continue;
    const didCreate = await createEscalationOncePerDay({
      employeeId: goal.userId,
      escalationType: "QUARTERLY_CHECKIN_OVERDUE",
      level: 2,
      message: `Quarter ${quarter} ${year} check-in overdue for goal "${goal.title}".`,
      now,
    });
    if (didCreate) created++;
  }
  return { scanned: goals.length, created };
}

export async function runEscalationChecks(): Promise<EscalationRunStats> {
  const now = new Date();
  const stats: EscalationRunStats = {
    scannedEmployees: 0,
    logsCreated: 0,
    failures: 0,
  };

  try {
    const goalsNotSubmitted = await checkGoalsNotSubmitted(now);
    stats.scannedEmployees += goalsNotSubmitted.scanned;
    stats.logsCreated += goalsNotSubmitted.created;
  } catch (error) {
    stats.failures++;
    console.error("[escalation] goals-not-submitted check failed", error);
  }

  try {
    const managerOverdue = await checkManagerApprovalOverdue(now);
    stats.scannedEmployees += managerOverdue.scanned;
    stats.logsCreated += managerOverdue.created;
  } catch (error) {
    stats.failures++;
    console.error("[escalation] manager-approval-overdue check failed", error);
  }

  try {
    const checkInOverdue = await checkQuarterlyCheckInOverdue(now);
    stats.scannedEmployees += checkInOverdue.scanned;
    stats.logsCreated += checkInOverdue.created;
  } catch (error) {
    stats.failures++;
    console.error("[escalation] quarterly-checkin-overdue check failed", error);
  }

  return stats;
}

export async function getRecentEscalationLogs(limit = 100) {
  try {
    return await prisma.escalationLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error("[escalation] failed to fetch escalation logs", error);
    return [];
  }
}
