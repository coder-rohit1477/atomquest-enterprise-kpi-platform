import Link from "next/link";
import {AlertTriangle, ArrowRight, Shield, } from "lucide-react";

import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [usersCount, managerCount, adminCount, goalCount, checkInCount, escalationCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "MANAGER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.goal.count(),
    prisma.quarterlyCheckIn.count(),
    prisma.escalationLog.count(),
  ]);

  const governanceCompletion = goalCount > 0 ? Math.min(100, Math.round((checkInCount / goalCount) * 100)) : 0;

  const modules = [
    {
      title: "User Control",
      href: "/admin/users",
      description: "Directory, role distribution, and reporting lines.",
      metric: `${usersCount} identities`,
    },
    {
      title: "Escalations",
      href: "/admin/escalations",
      description: "Submission, approval, and quarterly overdue tracking.",
      metric: `${escalationCount} events`,
    },
    {
      title: "System Logs",
      href: "/admin/logs",
      description: "Operational audit events and execution timeline.",
      metric: `${checkInCount} check-in records`,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      description: "Read-only enterprise performance oversight.",
      metric: `${goalCount} goals tracked`,
    },
    {
      title: "Governance Hub",
      href: "/admin/governance",
      description: "Control health indicators and compliance summaries.",
      metric: `${governanceCompletion}% completion`,
    },
    {
      title: "Reports Workspace",
      href: "/admin/reports",
      description: "Reporting handoff and operational exports.",
      metric: `${managerCount} managers`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700">
          <Shield className="h-3.5 w-3.5" />
          Admin Command
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Admin Command Center</h1>
        <p className="max-w-3xl text-lg font-medium italic text-slate-500">
          Enterprise control surface for identity, governance, escalation, audit, and reporting modules.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{usersCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{managerCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{adminCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escalations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{escalationCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Governance Completion Indicator</CardTitle>
          <CardDescription>Measured as recorded check-ins versus total goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Execution Coverage</span>
            <span className="text-sm font-black text-slate-900">{governanceCompletion}%</span>
          </div>
          <Progress value={governanceCompletion} className="h-2.5" />
          <p className="text-xs font-medium text-slate-500">
            {goalCount === 0
              ? "No goals have been registered yet."
              : `${checkInCount} check-in records mapped against ${goalCount} goals.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="group">
            <Card className="h-full rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(0,0,0,0.06)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center justify-between text-lg font-bold text-slate-900">
                  {module.title}
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{module.metric}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-3xl border-none bg-amber-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardContent className="flex items-start gap-3 p-6">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Operational Reminder</p>
            <p className="text-xs font-medium text-amber-800">
              Escalation and audit modules are read-oriented controls and should be reviewed at least once daily.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
