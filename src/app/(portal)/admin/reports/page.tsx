import Link from "next/link";
import { ArrowRight, FileText, PieChart, Shield } from "lucide-react";

import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [goalsTotal, checkInsTotal, completedCheckIns, employeeCount] = await Promise.all([
    prisma.goal.count(),
    prisma.quarterlyCheckIn.count(),
    prisma.quarterlyCheckIn.count({ where: { status: "COMPLETED" } }),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
  ]);

  const completionRate = checkInsTotal > 0 ? Math.round((completedCheckIns / checkInsTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">
          <Shield className="h-3.5 w-3.5" />
          Reports Hub
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Admin Reports Workspace</h1>
        <p className="max-w-3xl text-lg font-medium italic text-slate-500">
          Centralized reporting gateway for exports, operational analytics, and completion monitoring.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{employeeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracked Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{goalsTotal}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check-In Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Completion Indicator</CardTitle>
          <CardDescription>Completed quarterly check-ins over total submitted check-ins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Quarterly Completion</span>
            <span className="text-sm font-black text-slate-900">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2.5" />
          <p className="text-xs font-medium text-slate-500">
            {completedCheckIns} completed out of {checkInsTotal} recorded check-ins.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Reporting Navigation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-8 md:grid-cols-2">
          <Link href="/reports" className="group rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-900">Open Reports</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">Access export operations and enterprise reporting views.</p>
          </Link>
          <Link href="/admin/analytics" className="group rounded-2xl border border-slate-100 p-5 transition-colors hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PieChart className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-900">Open Analytics</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">Review aggregated trends and governance performance metrics.</p>
          </Link>
        </CardContent>
      </Card>

      {checkInsTotal === 0 && (
        <Card className="rounded-3xl border-dashed border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="p-8">
            <p className="text-sm font-bold text-slate-700">No check-in records are available for reporting yet.</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Reporting cards will automatically populate as quarterly updates are submitted.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
