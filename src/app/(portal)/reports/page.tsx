import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Activity, Filter, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/ExportButton";
import { exportGoalsCSV, exportCheckInsCSV } from "@/actions/export";
import { AnalyticsCharts } from "@/components/reports/AnalyticsCharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Goal, GoalStatus, ProgressHistory, QuarterlyCheckIn, User } from "@prisma/client";

type ReportGoal = Goal & {
  user: User;
  checkIns: QuarterlyCheckIn[];
};

type ActiveCheckInPeriod = {
  quarter: number;
  year: number;
  label: string;
};

function getActiveCheckInPeriod(date = new Date()): ActiveCheckInPeriod | null {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 7 && month <= 9) {
    return { quarter: 1, year, label: `Q1 ${year}` };
  }

  if (month >= 10 && month <= 12) {
    return { quarter: 2, year, label: `Q2 ${year}` };
  }

  if (month >= 1 && month <= 2) {
    return { quarter: 3, year, label: `Q3 ${year}` };
  }

  if (month === 3 || month === 4) {
    return { quarter: 4, year, label: `Q4 ${year}` };
  }

  return null;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; name?: string | null };
  const role = user?.role || "EMPLOYEE";
  const userId = user?.id;
  const activeCheckInPeriod = getActiveCheckInPeriod();

  if (!userId) return null;

  // Aggregate data for reports
  let goals: ReportGoal[] = [];
  let allUsersCount = 0;
  let sharedGoalParticipationCount = 0;
  let overdueCheckIns: ReportGoal[] = [];
  let atRiskGoalsCount = 0;

  const baseGoalQuery: { status?: GoalStatus } = {};
  if (statusFilter && statusFilter !== "ALL") {
    baseGoalQuery.status = statusFilter as GoalStatus;
  }

  if (role === "ADMIN") {
    goals = await prisma.goal.findMany({
      where: baseGoalQuery,
      include: { 
        user: true, 
        checkIns: { orderBy: { createdAt: "desc" } } 
      }
    });
    allUsersCount = await prisma.user.count({ where: { role: "EMPLOYEE" } });
    sharedGoalParticipationCount = await prisma.sharedGoalAssignment.count();
    
    // Calculate At-Risk (Latest check-in is AT_RISK or DELAYED)
    atRiskGoalsCount = goals.filter(g => 
      g.checkIns.length > 0 && (g.checkIns[0].status === "AT_RISK" || g.checkIns[0].status === "DELAYED")
    ).length;

    // Overdue Check-ins (Approved goals without Q2 2026 check-in)
    const currentQuarter = activeCheckInPeriod?.quarter ?? 2;
    const currentYear = activeCheckInPeriod?.year ?? 2026;
    overdueCheckIns = goals.filter(g => 
      (g.status === "APPROVED" || g.status === "LOCKED") && 
      !g.checkIns.some((ci) => ci.quarter === currentQuarter && ci.year === currentYear)
    );
  } else if (role === "MANAGER") {
    goals = await prisma.goal.findMany({
      where: { ...baseGoalQuery, user: { managerId: userId } },
      include: { 
        user: true, 
        checkIns: { orderBy: { createdAt: "desc" }, take: 1 } 
      }
    });
  } else {
    goals = await prisma.goal.findMany({ 
      where: { ...baseGoalQuery, userId },
      include: { 
        user: true, 
        checkIns: { orderBy: { createdAt: "desc" }, take: 1 } 
      }
    });
  }

  const statusCounts = {
    LOCKED: goals.filter(g => g.status === "LOCKED" || g.status === "APPROVED").length,
    PENDING: goals.filter(g => g.status === "PENDING_APPROVAL").length,
    DRAFT: goals.filter(g => g.status === "DRAFT").length,
    REJECTED: goals.filter(g => g.status === "REJECTED").length,
  };

  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((statusCounts.LOCKED / totalGoals) * 100) : 0;
  const approvalRate = totalGoals > 0 ? Math.round(((statusCounts.LOCKED + statusCounts.PENDING) / totalGoals) * 100) : 0;
  
  const totalProgress = goals.reduce((acc, g) => acc + (g.checkIns[0]?.progress || 0), 0);
  const avgProgress = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0;

  const adminStats = [
    { title: "Active Employees", value: allUsersCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Organizational Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Approval Velocity", value: `${approvalRate}%`, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Shared Goal Reach", value: sharedGoalParticipationCount, icon: Target, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const executiveKPIs = [
    { title: "Strategic Objectives", value: totalGoals },
    { title: "Pending Review", value: statusCounts.PENDING },
    { title: "Approved & Locked", value: statusCounts.LOCKED },
    { title: "At-Risk Targets", value: atRiskGoalsCount },
  ];

  const chartData = [
    { name: "Finalized", value: statusCounts.LOCKED, color: "#10b981" },
    { name: "Pending", value: statusCounts.PENDING, color: "#3b82f6" },
    { name: "Draft", value: statusCounts.DRAFT, color: "#64748b" },
    { name: "Rejected", value: statusCounts.REJECTED, color: "#ef4444" },
  ];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const history: ProgressHistory[] = await prisma.progressHistory.findMany({
    where: role === "MANAGER" ? {
        goal: { user: { managerId: userId } },
        createdAt: { gte: sixMonthsAgo }
    } : role === "ADMIN" ? {
        createdAt: { gte: sixMonthsAgo }
    } : {
        goal: { userId },
        createdAt: { gte: sixMonthsAgo }
    },
    orderBy: { createdAt: "asc" }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const velocityMap: Record<string, { total: number, count: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = monthNames[d.getMonth()];
    velocityMap[m] = { total: 0, count: 0 };
  }

  history.forEach(h => {
    const m = monthNames[h.createdAt.getMonth()];
    if (velocityMap[m]) {
        velocityMap[m].total += h.progress;
        velocityMap[m].count += 1;
    }
  });

  const velocityData = Object.entries(velocityMap).map(([name, data]) => ({
    name,
    progress: data.count > 0 ? Math.round(data.total / data.count) : 0
  }));

  let lastProgress = 0;
  velocityData.forEach(d => {
      if (d.progress === 0) d.progress = lastProgress;
      else lastProgress = d.progress;
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const goalsFilename = `goals_report_${timestamp}.csv`;
  const checkinsFilename = `checkins_report_${timestamp}.csv`;

  let employeeCompletion: {
    id: string;
    name: string | null;
    managerName: string | null;
    totalGoals: number;
    completedGoals: number;
    isComplete: boolean;
  }[] = [];

  let managerCompletion: {
    id: string;
    name: string | null;
    teamMembers: number;
    reviewedCheckIns: number;
    totalCheckIns: number;
    isComplete: boolean;
  }[] = [];

  if (role !== "EMPLOYEE" && activeCheckInPeriod) {
    const employeesForCompletion = await prisma.user.findMany({
      where: role === "ADMIN"
        ? { role: "EMPLOYEE" }
        : { role: "EMPLOYEE", managerId: userId },
      include: {
        manager: true,
        goals: {
          where: { status: { in: ["APPROVED", "LOCKED"] } },
          include: {
            checkIns: {
              where: {
                quarter: activeCheckInPeriod.quarter,
                year: activeCheckInPeriod.year,
              },
              include: {
                managerFeedback: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    employeeCompletion = employeesForCompletion.map((employee) => {
      const totalGoals = employee.goals.length;
      const completedGoals = employee.goals.filter((goal) => goal.checkIns.length > 0).length;
      return {
        id: employee.id,
        name: employee.name,
        managerName: employee.manager?.name ?? null,
        totalGoals,
        completedGoals,
        isComplete: totalGoals > 0 && completedGoals === totalGoals,
      };
    });

    const managersForCompletion = role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "MANAGER" },
          include: {
            employees: {
              where: { role: "EMPLOYEE" },
              include: {
                goals: {
                  where: { status: { in: ["APPROVED", "LOCKED"] } },
                  include: {
                    checkIns: {
                      where: {
                        quarter: activeCheckInPeriod.quarter,
                        year: activeCheckInPeriod.year,
                      },
                      include: {
                        managerFeedback: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: { id: userId },
          include: {
            employees: {
              where: { role: "EMPLOYEE" },
              include: {
                goals: {
                  where: { status: { in: ["APPROVED", "LOCKED"] } },
                  include: {
                    checkIns: {
                      where: {
                        quarter: activeCheckInPeriod.quarter,
                        year: activeCheckInPeriod.year,
                      },
                      include: {
                        managerFeedback: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

    managerCompletion = managersForCompletion.map((manager) => {
      const teamCheckIns = manager.employees.flatMap((employee) =>
        employee.goals.flatMap((goal) => goal.checkIns)
      );
      const reviewedCheckIns = teamCheckIns.filter((checkIn) => checkIn.managerFeedback).length;
      return {
        id: manager.id,
        name: manager.name,
        teamMembers: manager.employees.length,
        reviewedCheckIns,
        totalCheckIns: teamCheckIns.length,
        isComplete: teamCheckIns.length > 0 && reviewedCheckIns === teamCheckIns.length,
      };
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics Intelligence</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Strategic performance telemetry for {role === "MANAGER" ? "your team" : role === "ADMIN" ? "the enterprise" : "your portfolio"}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportButton action={exportGoalsCSV} filename={goalsFilename} label="Export Goals" />
          <ExportButton action={exportCheckInsCSV} filename={checkinsFilename} label="Export Check-ins" />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-slate-50/50 p-2">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
               <Filter className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            </div>
            {[
              { label: "All Objectives", value: "ALL" },
              { label: "Finalized", value: "LOCKED" },
              { label: "Pending", value: "PENDING_APPROVAL" },
              { label: "Draft", value: "DRAFT" },
              { label: "Rejected", value: "REJECTED" },
            ].map((f) => (
              <Link key={f.value} href={`/reports?status=${f.value}`}>
                 <Button 
                   variant={statusFilter === f.value || (!statusFilter && f.value === "ALL") ? "default" : "ghost"}
                   size="sm"
                   className={`rounded-xl text-[10px] font-bold uppercase tracking-wider h-9 px-4 ${
                     statusFilter === f.value || (!statusFilter && f.value === "ALL") 
                     ? "bg-slate-900 text-white shadow-md" 
                     : "text-slate-500 hover:bg-white hover:text-slate-900"
                   }`}
                 >
                   {f.label}
                 </Button>
              </Link>
            ))}
         </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(role === "ADMIN" ? adminStats : [
          { title: "Strategic Target", value: totalGoals, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Finalized Ratio", value: `${completionRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Aggregate Progress", value: `${avgProgress}%`, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Governance Queue", value: statusCounts.PENDING, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
        ]).map((stat, i) => (
          <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-2">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-black text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {role === "ADMIN" && (
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 flex items-center justify-between flex-row">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Compliance Oversight</CardTitle>
                <p className="text-sm text-slate-400 font-medium italic">
                  Missing {activeCheckInPeriod ? `${activeCheckInPeriod.label} ` : ""}performance updates
                </p>
              </div>
              <Badge variant="outline" className="text-rose-600 border-rose-100 bg-rose-50 font-bold px-3 py-1">{overdueCheckIns.length} Missing</Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {overdueCheckIns.length === 0 ? (
                <div className="p-24 text-center flex flex-col items-center">
                   <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-emerald-500" />
                   </div>
                   <p className="text-sm font-bold text-slate-900">Zero Overdue Compliance</p>
                   <p className="text-xs text-slate-400 mt-1">Organizational reporting is at 100% for this cycle.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {overdueCheckIns.map((g) => (
                    <div key={g.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                          {g.user.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{g.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{g.title}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest px-2">
                        {activeCheckInPeriod ? `Q${activeCheckInPeriod.quarter} Overdue` : "Overdue"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-lg font-bold">Executive Summary</CardTitle>
              <p className="text-sm text-slate-400 font-medium italic">High-level enterprise telemetry</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {executiveKPIs.map((kpi, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</span>
                    <div className="flex items-center gap-3">
                       <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${totalGoals > 0 ? Math.min(100, (Number(kpi.value) / totalGoals) * 100) : 0}%` }} />
                       </div>
                       <span className="text-xl font-black">{kpi.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {role !== "EMPLOYEE" && activeCheckInPeriod && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Employee Completion Dashboard</CardTitle>
                  <p className="text-sm text-slate-400 font-medium italic">
                    {activeCheckInPeriod.label} employee check-in completion status
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 font-bold">
                  {employeeCompletion.filter((entry) => entry.isComplete).length}/{employeeCompletion.length} Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[360px] overflow-y-auto">
                {employeeCompletion.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-400">
                    No employees with active approved goals in the current check-in cycle.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {employeeCompletion.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{entry.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {entry.managerName ? `Manager: ${entry.managerName}` : "Manager unassigned"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">
                            {entry.completedGoals}/{entry.totalGoals} Goals
                          </span>
                          <Badge
                            variant={entry.isComplete ? "success" : "warning"}
                            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                          >
                            {entry.isComplete ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Manager Review Completion</CardTitle>
                  <p className="text-sm text-slate-400 font-medium italic">
                    {activeCheckInPeriod.label} manager check-in feedback coverage
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 font-bold">
                  {managerCompletion.filter((entry) => entry.isComplete).length}/{managerCompletion.length} Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[360px] overflow-y-auto">
                {managerCompletion.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-400">
                    No manager review activity is required for the active check-in period yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {managerCompletion.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{entry.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {entry.teamMembers} Direct Reports
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">
                            {entry.reviewedCheckIns}/{entry.totalCheckIns} Reviews
                          </span>
                          <Badge
                            variant={entry.isComplete ? "success" : "warning"}
                            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                          >
                            {entry.isComplete ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AnalyticsCharts statusData={chartData} velocityData={velocityData} />

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Strategic Alignment Matrix</CardTitle>
            <p className="text-sm text-slate-400 font-medium italic">Granular performance data for all tracked objectives</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {totalGoals === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
               <FileText className="h-16 w-16 mb-4 opacity-10" />
               <p className="text-sm font-black text-slate-900">No report data identified</p>
               <p className="text-xs mt-1">Adjust filters or initialize objectives to see data here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Goal</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weight</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {goals.map((goal, i) => {
                    const progress = goal.checkIns[0]?.progress || 0;
                    return (
                      <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs shrink-0 border border-slate-100">
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate max-w-[300px]" title={goal.title}>{goal.title}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{goal.thrustArea} • {goal.user?.name || "System"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-black px-3 py-1">
                            {goal.weightage}%
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <Badge className={`${
                             goal.status === "LOCKED" || goal.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" :
                             goal.status === "PENDING_APPROVAL" ? "bg-blue-500/10 text-blue-600" :
                             goal.status === "REJECTED" ? "bg-red-500/10 text-red-600" :
                             "bg-slate-500/10 text-slate-600"
                           } border-none font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.1em]`}>
                             {goal.status.replace("_", " ")}
                           </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                             <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                             </div>
                             <span className="text-xs font-black text-slate-900">{progress}%</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
