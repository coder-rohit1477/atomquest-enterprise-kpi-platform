"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamAnalyticsProps {
  data: {
    statusDistribution: { name: string; value: number }[];
    avgProgress: number;
    totalGoals: number;
    delayedGoals: number;
  };
}

const COLORS = {
  ON_TRACK: "#10b981", // Emerald 500
  AT_RISK: "#f59e0b",  // Amber 500
  DELAYED: "#ef4444",  // Red 500
  COMPLETED: "#3b82f6", // Blue 500
  NO_CHECK_IN: "#94a3b8", // Slate 400
};

export function TeamAnalytics({ data }: TeamAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Avg Team Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgProgress.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Across {data.totalGoals} active goals</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Risk/Delayed Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{data.delayedGoals}</div>
          <p className="text-xs text-muted-foreground mt-1">Goals requiring attention</p>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 row-span-2">
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Current state of all team goals</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.NO_CHECK_IN} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} Goals`, 'Count']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Summary of manager responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending Reviews</span>
              <span className="font-bold">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk Flags Set</span>
              <span className="font-bold text-destructive">{data.delayedGoals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed Goals</span>
              <span className="font-bold text-emerald-600">
                {data.statusDistribution.find(d => d.name === "COMPLETED")?.value || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
