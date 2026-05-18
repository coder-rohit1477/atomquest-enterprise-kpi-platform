import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, User, Activity } from "lucide-react";
import { getAuditLogs } from "@/actions/audit";
import { format } from "date-fns";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { mapAuditLogToTimeline, sortTimeline } from "@/lib/activity-timeline";

export default async function LogsPage() {
  const logs = await getAuditLogs();
  const timelineItems = sortTimeline(logs.map((log) => mapAuditLogToTimeline(log)));

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">System Audit Logs</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-lg">
            Review critical system events, security logs, and administrative actions.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden border border-slate-100">
        <CardHeader className="border-b border-slate-50 p-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Event Feed</CardTitle>
              <CardDescription>Live stream of system activities and user operations.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-4 py-1 rounded-full">
              Last {logs.length} Events
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <ActivityTimeline
              title="Enterprise Activity Timeline"
              items={timelineItems}
              maxHeightClassName="max-h-[360px]"
              emptyTitle="No audit activity yet"
              emptyDescription="System and workflow events will appear here as operations are performed."
            />
          </div>
          {logs.length === 0 ? (
            <div className="p-24 text-center flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                 <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-50 scale-150" />
                 <div className="relative h-20 w-20 bg-white border border-slate-100 shadow-xl rounded-3xl flex items-center justify-center">
                   <FileText className="h-10 w-10 text-slate-400" />
                 </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <p className="text-slate-900 text-xl font-bold italic">No audit logs available yet.</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The system has not recorded any critical events or administrative actions in the current cycle.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="font-bold text-slate-900 w-[200px] py-6">Timestamp</TableHead>
                    <TableHead className="font-bold text-slate-900 w-[200px]">User</TableHead>
                    <TableHead className="font-bold text-slate-900 w-[150px]">Action</TableHead>
                    <TableHead className="font-bold text-slate-900 w-[150px]">Entity</TableHead>
                    <TableHead className="font-bold text-slate-900">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3 text-slate-600 font-medium">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="font-semibold text-slate-700">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`rounded-lg px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                            log.action.includes("Approved") ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            log.action.includes("Rejected") ? "bg-rose-50 text-rose-700 border-rose-100" :
                            log.action.includes("Submitted") ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-500 font-medium italic">
                          <Activity className="h-3.5 w-3.5" />
                          {log.entityType}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-xs truncate">
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
