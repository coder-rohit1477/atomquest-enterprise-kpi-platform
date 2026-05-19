import { getEmployeeCheckIns } from "@/actions/check-ins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckInForm } from "@/components/goals/CheckInForm";
import { CheckInHistory } from "@/components/goals/CheckInHistory";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, History, Target, Activity } from "lucide-react";
import { StatusBadge } from "@/components/goals/StatusBadge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function CheckInsPage() {
  const goals = await getEmployeeCheckIns();

  if (goals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-12 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[40px] bg-white">
          <div className="relative mb-8">
             <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 scale-150" />
             <div className="relative h-24 w-24 bg-white border border-slate-100 shadow-xl rounded-[2rem] flex items-center justify-center">
               <Target className="h-12 w-12 text-blue-600" />
             </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">No Strategic Goals Identified</h2>
          <p className="text-slate-400 max-w-sm mt-3 font-medium text-lg leading-relaxed">
            Quarterly updates are only enabled for goals that have completed the managerial approval governance cycle.
          </p>
          <Link href="/dashboard/goals">
            <Button className="mt-8 rounded-xl bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold shadow-lg shadow-blue-500/20">
              Visit Goals Command
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Strategic Check-Ins</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium italic">Execute progress updates and accomplishment telemetry for active objectives.</p>
      </div>

      <div className="grid auto-rows-fr items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {goals.map((goal) => {
          const latestCheckIn = goal.checkIns[0];
          const progress = latestCheckIn?.progress || 0;
          const isLockedGoal = String(goal.status) === "LOCKED" || String(goal.status) === "LOCKED_APPROVED";
          
          return (
            <Card key={goal.id} className="group flex h-full min-h-[320px] flex-col overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
              <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {goal.title}
                    </CardTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="h-3 w-3" />
                        {goal.thrustArea}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={latestCheckIn?.status || "ON_TRACK"} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col p-6 pt-4 sm:p-8 sm:pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress Vector</span>
                    <span className="text-lg font-black text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                        className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            progress === 100 ? "bg-emerald-500" : "bg-blue-600"
                        )} 
                        style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                <div className="mt-auto flex shrink-0 items-center gap-3 border-t border-slate-100 pt-5">
                  {!isLockedGoal ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="h-12 flex-1 rounded-xl bg-slate-900 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800 active:scale-95">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Execute Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="flex w-[95vw] max-w-2xl max-h-[90vh] flex-col overflow-y-auto rounded-2xl border-none p-0 shadow-2xl sm:rounded-[2.5rem]">
                        <div className="relative shrink-0 bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                           <DialogHeader className="relative z-10">
                              <DialogTitle className="text-3xl font-black tracking-tight">Quarterly Intelligence</DialogTitle>
                              <DialogDescription className="text-slate-400 mt-2 font-medium">
                              Synthesizing progress for objective: {goal.title}
                              </DialogDescription>
                          </DialogHeader>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6 lg:p-10">
                          <CheckInForm 
                              goalId={goal.id} 
                              uom={goal.uom}
                              target={goal.target}
                              defaultValues={{
                                  progress: progress,
                                  status: latestCheckIn?.status || "ON_TRACK"
                              }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                      <Button
                        disabled
                        className={cn(
                        "h-12 flex-1 justify-center rounded-xl border font-bold shadow-none opacity-100",
                        "border-slate-300 bg-slate-200 text-slate-800 disabled:bg-slate-200 disabled:text-slate-800"
                      )}
                    >
                      <PlusCircle className="mr-2 h-4 w-4 text-slate-700" />
                      Locked
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-12 shrink-0 rounded-xl border-slate-200 px-4 text-slate-600 transition-all hover:scale-105 hover:bg-slate-50 active:scale-95">
                        <History className="h-5 w-5 text-slate-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex w-[95vw] max-w-3xl max-h-[90vh] flex-col overflow-y-auto rounded-2xl border-none p-0 shadow-2xl sm:rounded-[2.5rem]">
                       <div className="relative shrink-0 bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                         <DialogHeader className="relative z-10">
                            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <History className="h-8 w-8 text-blue-500" />
                                Audit Timeline
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-2 font-medium">
                                Full historical telemetry for: {goal.title}
                            </DialogDescription>
                        </DialogHeader>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-10">
                        <CheckInHistory checkIns={goal.checkIns} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
