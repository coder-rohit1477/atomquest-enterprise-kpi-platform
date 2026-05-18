import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Search, Filter, ChevronRight, Briefcase, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/goals/StatusBadge";
import Link from "next/link";

export default async function TeamGoalsPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string };
  const userId = user?.id;

  if (!userId) return null;

  const employees = await prisma.user.findMany({
    where: { managerId: userId },
    include: {
      goals: {
        orderBy: { createdAt: "desc" },
        include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } }
      }
    }
  });

  const totalGoals = employees.reduce((acc, emp) => acc + emp.goals.length, 0);
  const totalProgress = employees.reduce((acc, emp) => 
    acc + emp.goals.reduce((gAcc, g) => gAcc + (g.checkIns[0]?.progress || 0), 0)
  , 0);
  const avgTeamProgress = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0;
  const pendingCount = employees.reduce((acc, emp) => acc + emp.goals.filter(g => g.status === "PENDING_APPROVAL").length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Team Performance Portfolio</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium italic">
            <Users className="h-4 w-4 text-blue-500" />
            Managing {employees.length} direct reports • Oversight of {totalGoals} strategic initiatives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input placeholder="Search employee or goal..." className="pl-10 h-11 w-[260px] rounded-xl border-slate-200 focus:ring-blue-500 transition-all shadow-sm" />
          </div>
          <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-5 font-bold text-slate-600 hover:bg-slate-50">
            <Filter className="h-4 w-4 mr-2" />
            Governance Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white group hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Team Execution Index</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="flex items-end justify-between mb-4">
              <div className="text-5xl font-black text-slate-900 tracking-tighter">{avgTeamProgress}%</div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${avgTeamProgress}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest">
              Aggregate progress across {totalGoals} active milestones
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-slate-900 text-white group hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Portfolio Integrity</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="text-4xl font-black text-white tracking-tight mb-6">Strategic High</div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Enterprise Aligned</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Q2 Velocity</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-blue-600 text-white group hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Governance Attention</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[180px] flex-col gap-6 p-8 pt-4">
            <div className="text-5xl font-black text-white tracking-tighter mb-2">
              {pendingCount}
            </div>
            <p className="text-sm font-bold text-blue-100/80 italic">Strategic items awaiting managerial sign-off</p>
            <Link href="/manager/dashboard" className="mt-auto block w-full">
              <Button className="h-12 w-full rounded-xl bg-white text-blue-600 shadow-lg font-black text-xs uppercase tracking-widest hover:bg-blue-50">
                Access Review Queue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-slate-900" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Direct Report Portfolios</h2>
        </div>
        
        <div className="grid gap-8">
          {employees.map((employee) => {
             const empGoalCount = employee.goals.length;
             const empApprovedCount = employee.goals.filter(g => g.status === "LOCKED" || g.status === "APPROVED").length;
             const empProgress = empGoalCount > 0 ? Math.round((empApprovedCount / empGoalCount) * 100) : 0;

             return (
                <Card key={employee.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[40px] overflow-hidden bg-white border border-slate-50 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/4 p-10 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-between">
                      <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6">
                        <div className="h-24 w-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center text-4xl font-black text-blue-600 border-4 border-white ring-8 ring-blue-50">
                          {employee.name?.[0]}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{employee.name}</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Personnel Grade: {employee.role}</p>
                        </div>
                      </div>

                      <div className="pt-8 w-full">
                           <div className="flex justify-between text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.1em]">
                             <span>Goal Finalization</span>
                             <span className="text-slate-900">{empProgress}%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-blue-600 transition-all duration-1000" 
                                style={{ width: `${empProgress}%` }} 
                             />
                           </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-0 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/30">
                              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Initiative</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weight</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {employee.goals.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                   No strategic goals initialized for this portfolio.
                                </td>
                              </tr>
                            ) : (
                              employee.goals.map((goal) => (
                                <tr key={goal.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                  <td className="px-8 py-6">
                                    <div className="space-y-1.5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{goal.title}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                                         <Briefcase className="h-3 w-3" />
                                         {goal.thrustArea} • Target: {goal.target} {goal.uom.split(' ')[0]}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600">
                                      {goal.weightage}%
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <StatusBadge status={goal.status} />
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <Link href={`/manager/dashboard?userId=${employee.id}`}>
                                      <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 px-3 font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-all">
                                        <ChevronRight className="mr-2 h-4 w-4" />
                                        View
                                      </Button>
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>
             );
          })}
        </div>
      </div>
    </div>
  );
}
