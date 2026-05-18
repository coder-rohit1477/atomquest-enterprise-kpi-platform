"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesColumn,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";

import {
  AnalyticsKpi,
  DepartmentHeatmapRow,
  ManagerEffectivenessDatum,
  QuarterlyTrendDatum,
  StatusDistributionDatum,
} from "@/lib/admin-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KPI_TONE_STYLES: Record<AnalyticsKpi["tone"], { icon: string; chip: string }> = {
  blue: { icon: "bg-blue-50 text-blue-600", chip: "text-blue-700" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", chip: "text-emerald-700" },
  amber: { icon: "bg-amber-50 text-amber-600", chip: "text-amber-700" },
  rose: { icon: "bg-rose-50 text-rose-600", chip: "text-rose-700" },
};

const HEATMAP_INTENSITY = [
  "bg-slate-100 text-slate-600",
  "bg-blue-100 text-blue-700",
  "bg-blue-200 text-blue-800",
  "bg-blue-500 text-white",
];

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Activity className="h-5 w-5 text-slate-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs font-medium leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="mb-6 h-3 w-24 rounded bg-slate-100" />
            <div className="mb-3 h-10 w-28 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-3">
          <div className="mb-6 h-4 w-32 rounded bg-slate-100" />
          <div className="h-[300px] rounded-3xl bg-slate-100" />
        </div>
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-4">
          <div className="mb-6 h-4 w-40 rounded bg-slate-100" />
          <div className="h-[300px] rounded-3xl bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:col-span-3">
          <div className="mb-6 h-4 w-40 rounded bg-slate-100" />
          <div className="h-[320px] rounded-3xl bg-slate-100" />
        </div>
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:col-span-2">
          <div className="mb-6 h-4 w-36 rounded bg-slate-100" />
          <div className="h-[320px] rounded-3xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function KpiGrid({ items }: { items: AnalyticsKpi[] }) {
  const icons = [BriefcaseBusiness, TrendingUp, ChartNoAxesColumn, Building2];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length];
        const styles = KPI_TONE_STYLES[item.tone];

        return (
          <Card
            key={item.label}
            className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
          >
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <div className="space-y-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </CardTitle>
                <div className="text-4xl font-black tracking-tight text-slate-900">{item.value}</div>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", styles.icon)}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className={cn("text-xs font-bold leading-relaxed", styles.chip)}>{item.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function GoalStatusPieCard({
  statusData,
}: {
  statusData: StatusDistributionDatum[];
}) {
  const hasData = statusData.some((entry) => entry.value > 0);

  return (
    <Card className="overflow-hidden rounded-[32px] border-none bg-slate-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] lg:col-span-3">
      <CardHeader className="border-b border-white/5 p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Goal Status Mix</CardTitle>
            <CardDescription className="font-medium text-slate-400">
              Distribution of enterprise goals by lifecycle state.
            </CardDescription>
          </div>
          <PieChartIcon className="h-6 w-6 text-white/25" />
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {hasData ? (
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={94}
                  paddingAngle={6}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "16px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No goal status data"
            description="Status distribution will appear once enterprise goals have been recorded."
          />
        )}
      </CardContent>
    </Card>
  );
}

export function QuarterlyTrendCard({
  trend,
}: {
  trend: QuarterlyTrendDatum[];
}) {
  return (
    <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-4">
      <CardHeader className="border-b border-slate-50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Quarterly Progress Trend</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Average quarterly completion trend across submitted check-ins.
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {trend.length > 0 ? (
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  name="Avg Progress"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#2563eb", strokeWidth: 3, stroke: "#fff" }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No quarterly trend yet"
            description="Trend data will populate once quarterly check-ins begin accumulating."
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ManagerEffectivenessCard({
  managers,
}: {
  managers: ManagerEffectivenessDatum[];
}) {
  return (
    <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:col-span-3">
      <CardHeader className="border-b border-slate-50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Manager Effectiveness</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Composite view of review throughput and team execution strength.
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {managers.length > 0 ? (
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={managers} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  dataKey="managerName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={120}
                  tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="effectivenessScore"
                  name="Effectiveness Score"
                  radius={[0, 12, 12, 0]}
                  fill="#10b981"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No manager analytics"
            description="Manager effectiveness appears when manager-led portfolios contain goals or check-ins."
          />
        )}
      </CardContent>
    </Card>
  );
}

function getHeatmapClass(completionRate: number) {
  if (completionRate >= 85) return HEATMAP_INTENSITY[3];
  if (completionRate >= 60) return HEATMAP_INTENSITY[2];
  if (completionRate >= 30) return HEATMAP_INTENSITY[1];
  return HEATMAP_INTENSITY[0];
}

export function DepartmentHeatmapCard({
  rows,
  reportingYear,
}: {
  rows: DepartmentHeatmapRow[];
  reportingYear: number;
}) {
  return (
    <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:col-span-2">
      <CardHeader className="border-b border-slate-50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Department Completion Heatmap</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Quarterly completion density by manager-led department in {reportingYear}.
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {rows.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,minmax(64px,1fr))] gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</span>
              {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
                <span
                  key={quarter}
                  className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                >
                  {quarter}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.department}
                  className="grid grid-cols-[minmax(0,1fr)_repeat(4,minmax(64px,1fr))] items-center gap-2"
                >
                  <span className="truncate pr-2 text-xs font-bold text-slate-700">{row.department}</span>
                  {row.cells.map((cell) => (
                    <div
                      key={`${row.department}-${cell.quarter}`}
                      className={cn(
                        "flex min-h-[64px] flex-col items-center justify-center rounded-2xl border border-white/60 px-2 text-center shadow-sm",
                        getHeatmapClass(cell.completionRate)
                      )}
                      title={`${row.department} ${cell.quarter}: ${cell.completedGoals}/${cell.totalGoals} goals completed`}
                    >
                      <span className="text-sm font-black">{cell.completionRate}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        {cell.completedGoals}/{cell.totalGoals}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No department heatmap yet"
            description="Department completion appears when manager-owned teams have finalized goals and recorded check-ins."
          />
        )}
      </CardContent>
    </Card>
  );
}
