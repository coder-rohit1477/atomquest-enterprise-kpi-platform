"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

interface AnalyticsChartsProps {
  statusData: { name: string; value: number; color: string }[];
  velocityData?: { name: string; progress: number }[];
}

export function AnalyticsCharts({ statusData, velocityData }: AnalyticsChartsProps) {
  // Fallback data for performance velocity (monthly)
  const defaultVelocityData = [
    { name: "Jan", progress: 45 },
    { name: "Feb", progress: 52 },
    { name: "Mar", progress: 48 },
    { name: "Apr", progress: 70 },
    { name: "May", progress: 61 },
    { name: "Jun", progress: 75 },
  ];

  const displayVelocityData = velocityData && velocityData.length > 0 ? velocityData : defaultVelocityData;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Performance Velocity</CardTitle>
              <p className="text-sm text-slate-400 font-medium">Monthly average goal progress trajectory</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayVelocityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-slate-900 text-white">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Portfolio Composition</CardTitle>
              <p className="text-sm text-slate-400 font-medium">Goal status distribution</p>
            </div>
            <PieChartIcon className="h-6 w-6 text-white/20" />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
