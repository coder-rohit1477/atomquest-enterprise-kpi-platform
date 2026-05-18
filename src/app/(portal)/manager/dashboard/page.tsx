import { getManagerQueue, getSharedGoalsOverview } from "@/actions/goals";
import { getTeam } from "@/actions/admin";
import { ApprovalQueueTable } from "@/components/goals/ApprovalQueueTable";
import { CreateSharedGoalModal } from "@/components/goals/CreateSharedGoalModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Clock, Users, ShieldCheck, Briefcase, Share2, Target } from "lucide-react";
import { Goal, ApprovalHistory, User, SharedGoalAssignment, QuarterlyCheckIn } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type GoalWithHistory = Goal & { history: ApprovalHistory[] };
type EmployeeWithGoals = User & { goals: GoalWithHistory[] };

type SharedGoalWithProgress = Goal & {
  assignments: (SharedGoalAssignment & {
    user: User & {
      goals: (Goal & {
        checkIns: QuarterlyCheckIn[]
      })[]
    }
  })[]
};

export default async function ManagerDashboardPage() {
  const [data, sharedGoals, team] = await Promise.all([
    getManagerQueue(),
    getSharedGoalsOverview(),
    getTeam()
  ]);

  const employees = data as unknown as EmployeeWithGoals[];
  const shared = sharedGoals as unknown as SharedGoalWithProgress[];

  const totalPending = employees.reduce(
    (acc, emp) => acc + emp.goals.filter(g => g.status === "PENDING_APPROVAL").length, 
    0
  );
  
  const totalApproved = employees.reduce(
    (acc, emp) => acc + emp.goals.filter(g => g.status === "LOCKED" || g.status === "APPROVED").length, 
    0
  );

  const stats = [
    { title: "Direct Reports", value: employees.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pending Review", value: totalPending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Approved & Locked", value: totalApproved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Managerial Command</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium italic">Execute goal governance and strategic alignment for your organizational unit.</p>
        </div>
        <div className="flex items-center gap-4">
           <CreateSharedGoalModal team={team} />
           <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
              <ShieldCheck className="h-7 w-7" />
           </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all group">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="text-4xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">Active Cycle Telemetry</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {shared.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Shared Objectives</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {shared.map((goal) => {
              const totalAssigned = goal.assignments.length;
              const aggregateProgress = totalAssigned > 0 
                ? Math.round(goal.assignments.reduce((sum, as) => {
                    const empGoal = as.user.goals.find(g => g.sharedGoalId === goal.id);
                    return sum + (empGoal?.checkIns?.[0]?.progress || 0);
                  }, 0) / totalAssigned)
                : 0;

              return (
                <Card key={goal.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-indigo-500/10 text-indigo-600 border-none mb-3 text-[9px] font-black uppercase tracking-widest px-2">Shared Objective</Badge>
                        <CardTitle className="text-lg font-black text-slate-900">{goal.title}</CardTitle>
                        <CardDescription className="text-xs font-medium mt-1">{goal.thrustArea} • {totalAssigned} Employees Assigned</CardDescription>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Target className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                        <span>Aggregate Progress</span>
                        <span className="text-slate-900">{aggregateProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${aggregateProgress}%` }} />
                      </div>
                      <div className="flex -space-x-2 pt-2">
                        {goal.assignments.slice(0, 5).map((as, i) => (
                          <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500" title={as.user.name || ""}>
                            {as.user.name?.[0]}
                          </div>
                        ))}
                        {totalAssigned > 5 && (
                          <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                            +{totalAssigned - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-slate-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Approval Governance Queue</h2>
        </div>
        <ApprovalQueueTable employees={employees} />
      </div>
    </div>
  );
}
