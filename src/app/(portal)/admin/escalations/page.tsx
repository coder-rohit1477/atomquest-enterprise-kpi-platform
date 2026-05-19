import { redirect } from "next/navigation";
import { AlertTriangle, Shield } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentEscalationLogs, runEscalationChecks } from "@/lib/escalation";

export const dynamic = "force-dynamic";

export default async function AdminEscalationsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session?.user?.id || user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [logs, runStats] = await Promise.all([
    getRecentEscalationLogs(150),
    runEscalationChecks(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
          <Shield className="h-3.5 w-3.5" />
          Escalation Engine
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Escalation Dashboard
        </h1>
        <p className="max-w-3xl text-lg font-medium italic text-slate-500">
          Lightweight oversight for submission and approval escalation events.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{logs.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Logs This Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{runStats.logsCreated}</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Run Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{runStats.failures}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-lg font-bold text-slate-900">Escalation Log Stream</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Level</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-sm font-medium text-slate-400">
                      No escalation events recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-8 py-6 text-xs font-medium text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-900">{log.employee.name || "Unknown"}</p>
                        <p className="text-[10px] font-medium text-slate-400">{log.employee.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <Badge className="rounded-full border-none bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                          {log.escalationType.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          L{log.level}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-700">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
