import { getManagerCheckInQueue, getTeamAnalytics } from "@/actions/check-ins";
import { TeamAnalytics } from "@/components/goals/TeamAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/goals/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManagerFeedbackForm } from "@/components/goals/ManagerFeedbackForm";
import { CheckInHistory, type CheckInHistoryItem } from "@/components/goals/CheckInHistory";
import { Eye, AlertCircle, History as HistoryIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ManagerCheckInsPage() {
  const employees = await getManagerCheckInQueue();
  const analytics = await getTeamAnalytics();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Team Progress Dashboard</h1>
        <p className="text-slate-500 font-medium italic">Monitor employee progress, review quarterly check-ins, and provide strategic feedback.</p>
      </div>

      <TeamAnalytics data={analytics} />

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-bold text-slate-900">Team Check-Ins</CardTitle>
          <CardDescription className="font-medium italic">Review quarterly updates from your team members and monitor progress across active objectives.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Employee</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Goal</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Update</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Progress</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-medium">
                    No employees found or no goals approved yet.
                  </TableCell>
                </TableRow>
              ) : (
                employees.flatMap((emp) => 
                  emp.goals.flatMap((goal) => {
                    const latestCheckIn = goal.checkIns[0];
                    if (!latestCheckIn) return [];

                    return (
                      <TableRow key={latestCheckIn.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                              <AvatarImage src={emp.image || ""} />
                              <AvatarFallback className="bg-blue-50 text-blue-600 font-black">{emp.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate font-black text-slate-800" title={goal.title}>
                            {goal.title}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{goal.thrustArea}</div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-600">
                          Q{latestCheckIn.quarter} {latestCheckIn.year}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                             <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[60px] overflow-hidden">
                                <div 
                                    className="bg-blue-600 h-1.5 rounded-full transition-all" 
                                    style={{ width: `${latestCheckIn.progress}%` }}
                                />
                             </div>
                             <span className="text-xs font-black text-slate-900">{latestCheckIn.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={latestCheckIn.status} />
                            {latestCheckIn.managerFeedback?.isConcern && (
                              <Badge variant="destructive" className="h-5 px-1.5 rounded-md">
                                <AlertCircle className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end items-center gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold h-9 px-4 transition-all hover:scale-105 active:scale-95 flex items-center shadow-lg shadow-slate-900/10"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Review Activity
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="flex w-[95vw] max-w-4xl max-h-[90vh] flex-col overflow-y-auto rounded-2xl border-none p-0 shadow-2xl sm:rounded-[32px]">
                                    <div className="relative shrink-0 overflow-hidden bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                                        <DialogHeader>
                                            <div className="flex items-center gap-4 mb-4">
                                                <Avatar className="h-12 w-12 border-2 border-white/10">
                                                    <AvatarImage src={emp.image || ""} />
                                                    <AvatarFallback className="bg-blue-600 text-white font-black">{emp.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <DialogTitle className="text-2xl font-black tracking-tight">Review Check-In: {emp.name}</DialogTitle>
                                                    <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                        Strategic Objective: {goal.title} | Q{latestCheckIn.quarter} {latestCheckIn.year}
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                    </div>
                                    
                                    <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6 lg:p-10">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
                                            <div className="space-y-8">
                                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                                                    Employee Submission
                                                </h3>
                                                <div className="space-y-6">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accomplishments</span>
                                                        <div className="text-sm mt-2 text-slate-600 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                                                            {latestCheckIn.accomplishments}
                                                        </div>
                                                    </div>
                                                    {latestCheckIn.challenges && (
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Challenges</span>
                                                            <div className="text-sm mt-2 text-slate-600 font-medium bg-red-50/30 p-4 rounded-2xl border border-red-100/50 whitespace-pre-wrap leading-relaxed">
                                                                {latestCheckIn.challenges}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {latestCheckIn.nextSteps && (
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Steps</span>
                                                            <div className="text-sm mt-2 text-slate-600 font-medium bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 whitespace-pre-wrap leading-relaxed">
                                                                {latestCheckIn.nextSteps}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                                    Strategic Feedback
                                                </h3>
                                                <ManagerFeedbackForm 
                                                    checkInId={latestCheckIn.id} 
                                                    defaultValues={{
                                                        comment: latestCheckIn.managerFeedback?.comment,
                                                        isConcern: latestCheckIn.managerFeedback?.isConcern,
                                                        requestUpdate: latestCheckIn.managerFeedback?.requestUpdate
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 border-t border-slate-50 pt-8 sm:mt-12 sm:pt-10">
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <HistoryIcon className="h-4 w-4 text-slate-500" />
                                                </div>
                                                Performance Trajectory
                                            </h4>
                                            <CheckInHistory checkIns={goal.checkIns as CheckInHistoryItem[]} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
