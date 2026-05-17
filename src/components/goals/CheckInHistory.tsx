"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { MessageSquare, Calendar, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { CheckInStatus } from "@prisma/client";

interface CheckInHistoryProps {
  checkIns: {
    id: string;
    quarter: number;
    year: number;
    progress: number;
    status: CheckInStatus;
    accomplishments: string;
    nextSteps: string | null;
    challenges: string | null;
    createdAt: Date;
    managerFeedback: {
      id: string;
      comment: string;
      isConcern: boolean;
      createdAt: Date;
    } | null;
  }[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  if (checkIns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400">
        <Calendar className="h-12 w-12 mb-4 opacity-10" />
        <p className="text-sm font-bold text-slate-900">No check-in history found</p>
        <p className="text-xs mt-1 font-medium">Your quarterly progress updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {checkIns.map((checkIn) => (
        <Card key={checkIn.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                 <CardTitle className="text-lg font-black text-slate-900">
                   Q{checkIn.quarter} {checkIn.year} Update
                 </CardTitle>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Submitted {format(new Date(checkIn.createdAt), "MMMM dd, yyyy")}
                 </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-black text-slate-900">{checkIn.progress}% COMPLETED</span>
              </div>
              <StatusBadge status={checkIn.status} />
            </div>
          </CardHeader>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Key Accomplishments
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                  {checkIn.accomplishments}
                </p>
              </div>
              
              {checkIn.nextSteps && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                    Strategic Next Steps
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {checkIn.nextSteps}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {checkIn.challenges && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    Critical Blockers
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {checkIn.challenges}
                  </p>
                </div>
              )}
              
              {checkIn.managerFeedback ? (
                <div className="p-6 bg-slate-900 rounded-[24px] text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between relative z-10">
                    <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Executive Feedback
                    </span>
                    {checkIn.managerFeedback.isConcern && (
                      <Badge variant="destructive" className="bg-red-500 text-[10px] font-black px-2 py-0">URGENT CONCERN</Badge>
                    )}
                  </h4>
                  <p className="text-sm italic text-slate-300 leading-relaxed relative z-10">
                    &quot;{checkIn.managerFeedback.comment}&quot;
                  </p>
                  <div className="text-[10px] font-bold text-slate-500 mt-4 pt-4 border-t border-white/5 uppercase tracking-widest relative z-10">
                     Review Intelligence Active • {format(new Date(checkIn.managerFeedback.createdAt), "PPP")}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[24px] border-2 border-dotted border-slate-200 text-slate-400">
                    <MessageSquare className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Managerial Review</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
