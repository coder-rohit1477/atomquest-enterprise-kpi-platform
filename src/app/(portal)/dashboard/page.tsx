import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, TrendingUp, Calendar, ChevronRight, Shield, CheckCircle2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";



export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; name?: string | null };
  const role = user?.role || "EMPLOYEE";
  const userId = user?.id;

  if (!userId) return null;

  // Real stats fetching (basic)
  let activeGoals = 0;
  let teamMembers = 0;
  let pendingApprovals = 0;
  let avgProgress = 0;
  let completionRate = 0;

  if (role === "EMPLOYEE") {
    const userGoals = await prisma.goal.findMany({ 
      where: { userId },
      include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    activeGoals = userGoals.length;
    const totalProgress = userGoals.reduce((acc, g) => acc + (g.checkIns[0]?.progress || 0), 0);
    avgProgress = activeGoals > 0 ? Math.round(totalProgress / activeGoals) : 0;
    const finalized = userGoals.filter(g => g.status === "LOCKED" || g.status === "APPROVED").length;
    completionRate = activeGoals > 0 ? Math.round((finalized / activeGoals) * 100) : 0;
  } else if (role === "MANAGER") {
    teamMembers = await prisma.user.count({ where: { managerId: userId } });
    pendingApprovals = await prisma.goal.count({ 
      where: { 
        user: { managerId: userId },
        status: "PENDING_APPROVAL"
      } 
    });
    const teamGoals = await prisma.goal.findMany({
      where: { user: { managerId: userId } },
      include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    const totalProgress = teamGoals.reduce((acc, g) => acc + (g.checkIns[0]?.progress || 0), 0);
    avgProgress = teamGoals.length > 0 ? Math.round(totalProgress / teamGoals.length) : 0;
  } else {
    // Admin
    const allGoals = await prisma.goal.findMany({
      include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    activeGoals = allGoals.length;
    const totalProgress = allGoals.reduce((acc, g) => acc + (g.checkIns[0]?.progress || 0), 0);
    avgProgress = activeGoals > 0 ? Math.round(totalProgress / activeGoals) : 0;
  }

  // Fetch real recent activity
  const recentActivities = await prisma.approvalHistory.findMany({
    where: role === "MANAGER" ? {
      goal: { user: { managerId: userId } }
    } : role === "ADMIN" ? {} : {
      goal: { userId }
    },
    include: {
      goal: true,
    },
    orderBy: { createdAt: "desc" },
    take: 4
  });

  const activities = recentActivities.map(act => ({
    type: act.toStatus === "PENDING_APPROVAL" ? "Submission" : 
          act.toStatus === "LOCKED" ? "Approval" :
          act.toStatus === "REJECTED" ? "Rejection" : "Rework",
    title: act.goal.title,
    time: formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }),
    user: act.toStatus === "PENDING_APPROVAL" ? "Employee" : "Management",
    link: role === "MANAGER" ? "/manager/dashboard" : role === "ADMIN" ? "/admin/users" : "/dashboard/goals",
    status: act.toStatus
  }));

  // Governance Summary Metrics for Admin/Manager
  let governanceMetrics: { label: string; count: number; color: string }[] = [];
  if (role !== "EMPLOYEE") {
     const overdueCount = await prisma.goal.count({
       where: {
         status: "APPROVED",
         NOT: {
           checkIns: {
             some: { quarter: 2, year: 2026 }
           }
         }
       }
     });

     const pendingApprovalsAll = await prisma.goal.count({
       where: { status: "PENDING_APPROVAL" }
     });

     governanceMetrics = [
       { label: "Pending Approvals", count: pendingApprovalsAll, color: "text-amber-600" },
       { label: "Overdue Check-ins", count: overdueCount, color: "text-rose-600" },
     ];
  }

  // Fallback if no real activity yet
  const displayActivities = activities.length > 0 ? activities : [
    { type: "System", title: "Strategic Performance Cycle Initialized", time: "Just now", user: "Governance", link: "/dashboard" }
  ];

  const stats = [
    { 
      title: role === "MANAGER" ? "Direct Reports" : "My Active Goals", 
      value: role === "MANAGER" ? teamMembers.toString() : activeGoals.toString(), 
      icon: role === "MANAGER" ? Users : Target, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      title: role === "MANAGER" ? "Pending Reviews" : "Team Progress", 
      value: role === "MANAGER" ? pendingApprovals.toString() : `${avgProgress}%`, 
      icon: role === "MANAGER" ? CheckCircle2 : TrendingUp, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { title: "Completion Rate", value: `${completionRate}%`, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Engagement", value: "High", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {role === "MANAGER" ? "Managerial Intelligence" : role === "ADMIN" ? "Administrator Command" : "Performance Hub"}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Strategic overview for {session?.user?.name}. Your enterprise brief is ready.</p>
        </div>
        <div className="flex items-center gap-3">
          {role === "EMPLOYEE" && (            <Link href="/dashboard/goals">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 h-11 px-5 shadow-lg shadow-blue-500/20 font-bold transition-all hover:scale-105 active:scale-95">
                Create New Goal
              </Button>
            </Link>
          )}

          {role === "MANAGER" && (
            <Link href="/manager/dashboard">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 h-11 px-5 shadow-lg shadow-blue-500/20 font-bold transition-all hover:scale-105 active:scale-95">
                Go to Approval Queue
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center font-bold">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                <span className="text-emerald-500 font-black">+12.5%</span> VS LAST CYCLE
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between p-8">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Goal Progress Matrix</CardTitle>
              <p className="text-sm text-slate-400 font-medium italic">Strategic alignment and trajectory across departments</p>
            </div>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="text-blue-600 font-bold h-9 rounded-lg hover:bg-blue-50">View Analytics</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[280px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 group cursor-pointer hover:bg-slate-50 transition-colors">
               <div className="flex gap-2 items-end h-32 mb-6">
                 {[40, 70, 45, 90, 65, 80, 55, 75].map((h, i) => (
                   <div key={i} className="w-6 bg-blue-500/20 rounded-t-lg group-hover:bg-blue-500/40 transition-all" style={{ height: `${h}%` }} />
                 ))}
               </div>
               <Activity className="h-10 w-10 mb-2 opacity-20 text-blue-600" />
               <p className="text-sm font-bold text-slate-900">Performance Metrics Unified</p>
               <p className="text-xs mt-1 font-medium">Click &quot;View Analytics&quot; for deep-dive reporting</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-lg font-black text-slate-900">Priority Stream</CardTitle>
            <p className="text-sm text-slate-400 font-medium italic">Real-time workflow and action history</p>
          </CardHeader>
          <CardContent className="p-0">
            {governanceMetrics.length > 0 && (
              <div className="p-6 bg-slate-50/50 flex items-center gap-6 border-b border-slate-100">
                {governanceMetrics.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
                    <p className={`text-xl font-black ${m.color}`}>{m.count}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="divide-y divide-slate-50">
              {displayActivities.map((activity, i) => (
                <Link key={i} href={activity.link}>
                  <div className="flex items-center justify-between p-6 hover:bg-slate-50/80 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-sm shadow-sm">
                        {activity.type[0]}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{activity.title}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{activity.type} • {activity.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-4 bg-slate-50/50">
               <Link href={role === "MANAGER" ? "/manager/dashboard" : role === "ADMIN" ? "/admin/users" : "/dashboard/goals"}>
                 <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900">Enter Activity Command Center</Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {role === "ADMIN" && (
        <Card className="border-none bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative p-4">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] -ml-32 -mb-32" />
          <CardHeader className="relative z-10 pt-12 px-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white text-3xl font-black tracking-tighter">System Nexus</CardTitle>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl font-medium">Elevated administrative control active. You have full visibility into the enterprise goal architecture and system audit logs.</p>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-wrap gap-4 pb-12 px-12 mt-8">
            <Link href="/admin/users">
              <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-14 px-8 shadow-xl shadow-blue-500/20 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                User Management
              </Button>
            </Link>
            <Link href="/admin/logs">
              <Button variant="outline" className="rounded-2xl border-slate-700 text-white bg-white/5 hover:bg-white/10 h-14 px-8 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                System Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

