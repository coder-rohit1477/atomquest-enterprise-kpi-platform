import Link from "next/link";
import { CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";

import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";



export default async function AdminGovernancePage() {
  const [goalsTotal, pendingApproval, lockedGoals, logsTotal, escalationTotal] = await Promise.all([
    prisma.goal.count(),
    prisma.goal.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.goal.count({ where: { status: "LOCKED" } }),
    prisma.auditLog.count(),
    prisma.escalationLog.count(),
  ]);

  const finalizedRate = goalsTotal > 0 ? Math.round((lockedGoals / goalsTotal) * 100) : 0;
  const reviewRate = goalsTotal > 0 ? Math.round(((goalsTotal - pendingApproval) / goalsTotal) * 100) : 0;

  const controls = [
    {
      name: "Goal Finalization",
      value: finalizedRate,
      detail: `${lockedGoals} of ${goalsTotal} goals locked`,
    },
    {
      name: "Approval Throughput",
      value: reviewRate,
      detail: `${pendingApproval} goals still pending approval`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Governance
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Governance Operations</h1>
        <p className="max-w-3xl text-lg font-medium italic text-slate-500">
          Control indicators and review summaries for enterprise approval and compliance flow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{goalsTotal}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{pendingApproval}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escalation Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">{escalationTotal}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Completion Indicators</CardTitle>
          <CardDescription>Control health scorecards for governance execution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          {controls.map((control) => (
            <div key={control.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{control.name}</p>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {control.value}%
                </Badge>
              </div>
              <Progress value={control.value} className="h-2.5" />
              <p className="text-xs font-medium text-slate-500">{control.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Governance Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-8 md:grid-cols-2">
          <Link href="/admin/logs" className="rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-900">Open System Logs</p>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">Review audit trail and recent administrative activity.</p>
          </Link>
          <Link href="/admin/escalations" className="rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-900">Open Escalations</p>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">Track overdue submission and approval exceptions.</p>
          </Link>
        </CardContent>
      </Card>

      {logsTotal === 0 && (
        <Card className="rounded-3xl border-dashed border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="p-8">
            <p className="text-sm font-bold text-slate-700">No audit records are currently available.</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Governance metrics will gain fidelity as operational activity is recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
