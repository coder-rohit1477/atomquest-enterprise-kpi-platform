import { GoalStatus } from "@prisma/client";

import prisma from "@/lib/prisma";

export type AnalyticsKpi = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "amber" | "rose";
};

export type StatusDistributionDatum = {
  name: string;
  value: number;
  color: string;
};

export type DepartmentHeatmapCell = {
  quarter: string;
  completionRate: number;
  completedGoals: number;
  totalGoals: number;
};

export type DepartmentHeatmapRow = {
  department: string;
  cells: DepartmentHeatmapCell[];
};

export type OverviewAnalyticsResponse = {
  kpis: AnalyticsKpi[];
  statusDistribution: StatusDistributionDatum[];
  departmentHeatmap: DepartmentHeatmapRow[];
  reportingYear: number;
};

export type QuarterlyTrendDatum = {
  period: string;
  progress: number;
  checkIns: number;
};

export type QuarterlyAnalyticsResponse = {
  trend: QuarterlyTrendDatum[];
};

export type ManagerEffectivenessDatum = {
  managerId: string;
  managerName: string;
  directReports: number;
  pendingApprovals: number;
  finalizedGoals: number;
  averageProgress: number;
  effectivenessScore: number;
};

export type ManagerAnalyticsResponse = {
  managers: ManagerEffectivenessDatum[];
};

const FINALIZED_GOAL_STATUSES: GoalStatus[] = ["APPROVED", "LOCKED"];
const STATUS_ORDER: GoalStatus[] = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "LOCKED", "REJECTED"];
const STATUS_LABELS: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  LOCKED: "Locked",
  REJECTED: "Rejected",
};
const STATUS_COLORS: Record<GoalStatus, string> = {
  DRAFT: "#64748b",
  PENDING_APPROVAL: "#3b82f6",
  APPROVED: "#10b981",
  LOCKED: "#0f766e",
  REJECTED: "#ef4444",
};

function round(value: number) {
  return Math.round(value);
}

export async function getOverviewAnalyticsData(): Promise<OverviewAnalyticsResponse> {
  const latestYearAggregation = await prisma.quarterlyCheckIn.aggregate({
    _max: { year: true },
  });

  const reportingYear = latestYearAggregation._max.year ?? new Date().getFullYear();

  const [
    employeeCount,
    managerCount,
    totalGoals,
    totalCheckIns,
    averageProgressAggregation,
    statusBreakdown,
    managerTeams,
    yearlyCheckIns,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.user.count({ where: { role: "MANAGER" } }),
    prisma.goal.count(),
    prisma.quarterlyCheckIn.count({ where: { year: reportingYear } }),
    prisma.quarterlyCheckIn.aggregate({
      where: { year: reportingYear },
      _avg: { progress: true },
    }),
    prisma.goal.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: "MANAGER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        employees: {
          where: { role: "EMPLOYEE" },
          select: {
            goals: {
              where: { status: { in: FINALIZED_GOAL_STATUSES } },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.quarterlyCheckIn.findMany({
      where: { year: reportingYear },
      select: {
        goalId: true,
        quarter: true,
        goal: {
          select: {
            user: {
              select: {
                managerId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const countsByStatus = new Map<GoalStatus, number>();
  for (const entry of statusBreakdown) {
    countsByStatus.set(entry.status, entry._count._all);
  }

  const finalizedGoals = FINALIZED_GOAL_STATUSES.reduce(
    (sum, status) => sum + (countsByStatus.get(status) ?? 0),
    0
  );
  const pendingGoals = countsByStatus.get("PENDING_APPROVAL") ?? 0;
  const averageProgress = round(averageProgressAggregation._avg.progress ?? 0);

  const kpis: AnalyticsKpi[] = [
    {
      label: "Employee Base",
      value: employeeCount.toString(),
      detail: `${managerCount} active managers across the portal`,
      tone: "blue",
    },
    {
      label: "Goal Volume",
      value: totalGoals.toString(),
      detail: `${finalizedGoals} goals finalized for the active cycle`,
      tone: "emerald",
    },
    {
      label: "Pending Governance",
      value: pendingGoals.toString(),
      detail: "Strategic items currently awaiting review",
      tone: "amber",
    },
    {
      label: "Check-In Velocity",
      value: `${averageProgress}%`,
      detail: `${totalCheckIns} quarterly submissions recorded in ${reportingYear}`,
      tone: "rose",
    },
  ];

  const statusDistribution = STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    value: countsByStatus.get(status) ?? 0,
    color: STATUS_COLORS[status],
  }));

  const checkInLookup = new Map<string, Set<string>>();
  for (const checkIn of yearlyCheckIns) {
    const managerId = checkIn.goal.user.managerId;
    if (!managerId) continue;

    const mapKey = `${managerId}:${checkIn.quarter}`;
    const trackedGoals = checkInLookup.get(mapKey) ?? new Set<string>();
    trackedGoals.add(checkIn.goalId);
    checkInLookup.set(mapKey, trackedGoals);
  }

  const departmentHeatmap: DepartmentHeatmapRow[] = managerTeams.map((manager) => {
    const eligibleGoalIds = new Set(
      manager.employees.flatMap((employee) => employee.goals.map((goal) => goal.id))
    );
    const totalEligibleGoals = eligibleGoalIds.size;

    return {
      department: `${manager.name ?? "Unassigned"} Team`,
      cells: [1, 2, 3, 4].map((quarter) => {
        const completedGoals = checkInLookup.get(`${manager.id}:${quarter}`)?.size ?? 0;
        const completionRate = totalEligibleGoals > 0 ? round((completedGoals / totalEligibleGoals) * 100) : 0;

        return {
          quarter: `Q${quarter}`,
          completionRate,
          completedGoals,
          totalGoals: totalEligibleGoals,
        };
      }),
    };
  });

  return {
    kpis,
    statusDistribution,
    departmentHeatmap,
    reportingYear,
  };
}

export async function getQuarterlyAnalyticsData(): Promise<QuarterlyAnalyticsResponse> {
  const groupedTrend = await prisma.quarterlyCheckIn.groupBy({
    by: ["year", "quarter"],
    _avg: { progress: true },
    _count: { _all: true },
    orderBy: [{ year: "asc" }, { quarter: "asc" }],
  });

  const trend = groupedTrend.slice(-8).map((entry) => ({
    period: `Q${entry.quarter} ${entry.year}`,
    progress: round(entry._avg.progress ?? 0),
    checkIns: entry._count._all,
  }));

  return { trend };
}

export async function getManagerAnalyticsData(): Promise<ManagerAnalyticsResponse> {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      employees: {
        where: { role: "EMPLOYEE" },
        select: {
          goals: {
            select: {
              status: true,
              checkIns: {
                orderBy: [{ year: "desc" }, { quarter: "desc" }],
                take: 1,
                select: { progress: true },
              },
            },
          },
        },
      },
    },
  });

  const managerData = managers.map((manager) => {
    const directReports = manager.employees.length;
    const goals = manager.employees.flatMap((employee) => employee.goals);
    const totalGoals = goals.length;
    const pendingApprovals = goals.filter((goal) => goal.status === "PENDING_APPROVAL").length;
    const finalizedGoals = goals.filter((goal) => FINALIZED_GOAL_STATUSES.includes(goal.status)).length;
    const progressValues = goals
      .map((goal) => goal.checkIns[0]?.progress ?? null)
      .filter((value): value is number => value !== null);
    const averageProgress =
      progressValues.length > 0
        ? round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
        : 0;
    const approvalRate = totalGoals > 0 ? (finalizedGoals / totalGoals) * 100 : 0;
    const effectivenessScore = round((approvalRate + averageProgress) / 2);

    return {
      managerId: manager.id,
      managerName: manager.name ?? "Unassigned Manager",
      directReports,
      pendingApprovals,
      finalizedGoals,
      averageProgress,
      effectivenessScore,
    };
  });

  managerData.sort((left, right) => right.effectivenessScore - left.effectivenessScore);

  return { managers: managerData };
}
