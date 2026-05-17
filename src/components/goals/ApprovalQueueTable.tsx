"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Goal, ApprovalHistory, User } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { GoalReviewModal } from "./GoalReviewModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ChevronRight, User as UserIcon, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

type GoalWithHistory = Goal & { history: ApprovalHistory[] };
type EmployeeWithGoals = User & { goals: GoalWithHistory[] };

interface ApprovalQueueTableProps {
  employees: EmployeeWithGoals[];
}

export function ApprovalQueueTable({ employees }: ApprovalQueueTableProps) {
  const [selectedGoal, setSelectedGoal] = useState<GoalWithHistory | null>(null);
  const router = useRouter();

  if (employees.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-20 text-center border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[40px] bg-white">
        <div className="rounded-3xl bg-slate-50 p-6 mb-6">
          <ShieldAlert className="h-10 w-10 text-slate-300" />
        </div>
        <CardTitle className="text-2xl font-black text-slate-900">Governance Queue Empty</CardTitle>
        <p className="text-slate-400 max-w-sm mt-2 font-medium">
          There are no strategic goals pending administrative review from your direct reports at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {employees.map((employee) => (
        <Card key={employee.id} className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white">
          <CardHeader className="bg-slate-50/50 pb-6 px-8 pt-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
                    {employee.name?.[0] || "E"}
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">{employee.name}</CardTitle>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">{employee.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
                   <p className="text-sm font-black text-amber-600">
                     {employee.goals.filter(g => g.status === "PENDING_APPROVAL").length} Goals
                   </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved</p>
                   <p className="text-sm font-black text-emerald-600">
                     {employee.goals.filter(g => g.status === "LOCKED" || g.status === "APPROVED").length} Goals
                   </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-50">
                    <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Goal</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thrust Area</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weight</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Review</th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.goals.map((goal) => (
                    <TableRow key={goal.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors group">
                      <TableCell className="px-8 py-6 font-bold text-slate-900">{goal.title}</TableCell>
                      <TableCell className="px-8 py-6 text-slate-500 font-medium">{goal.thrustArea}</TableCell>
                      <TableCell className="px-8 py-6 text-center">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600">
                          {goal.weightage}%
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-center">
                        <StatusBadge status={goal.status} />
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedGoal(goal)}
                          className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white transition-all p-0 group-hover:scale-110"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedGoal && (
        <GoalReviewModal
          goal={selectedGoal}
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onActionComplete={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
