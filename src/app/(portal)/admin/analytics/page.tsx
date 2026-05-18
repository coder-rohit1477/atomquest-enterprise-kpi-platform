import { redirect } from "next/navigation";
import { BarChart3, Shield } from "lucide-react";

import { auth } from "@/auth";
import { AdminAnalyticsDashboard } from "@/components/admin/analytics/AdminAnalyticsDashboard";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session?.user?.id || user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
            <Shield className="h-3.5 w-3.5" />
            Admin Analytics
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Enterprise Analytics Command
            </h1>
            <p className="mt-2 max-w-3xl text-lg font-medium italic text-slate-500">
              Aggregated oversight for goal governance, quarterly execution, and manager effectiveness.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Isolated Module</p>
            <p className="text-sm font-bold text-slate-900">Read-only enterprise analytics</p>
          </div>
        </div>
      </div>

      <AdminAnalyticsDashboard />
    </div>
  );
}
