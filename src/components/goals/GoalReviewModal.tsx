"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Goal, ApprovalHistory } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { handleManagerAction } from "@/actions/goals";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, RotateCcw, MessageSquare, History, Target } from "lucide-react";

interface GoalReviewModalProps {
  goal: Goal & { history: ApprovalHistory[] };
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export function GoalReviewModal({ goal, isOpen, onClose, onActionComplete }: GoalReviewModalProps) {
  const [target, setTarget] = useState(goal.target);
  const [weightage, setWeightage] = useState(goal.weightage);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onAction = async (action: "APPROVE" | "REJECT" | "REWORK") => {
    setIsSubmitting(true);
    try {
      const updates = action === "APPROVE" ? { target, weightage } : undefined;
      const result = await handleManagerAction(goal.id, action, comment, updates);
      if (result.success) {
        toast.success(`Goal ${action.toLowerCase()}ed successfully`);
        onActionComplete();
        onClose();
      } else {
        toast.error("Failed to process action");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">{goal.title}</DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Enterprise Performance Review • {goal.thrustArea}
                </DialogDescription>
              </div>
              <StatusBadge status={goal.status} />
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Unit of Measure</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-slate-700">{goal.uom}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Current Status</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <History className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">{goal.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Goal Description
            </Label>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
              &quot;{goal.description || "No detailed description provided for this strategic goal."}&quot;
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <Label htmlFor="target" className="text-sm font-bold text-slate-700">Adjust Target</Label>
              <Input
                id="target"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.valueAsNumber || 0)}
                disabled={goal.status === "LOCKED"}
                className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 font-bold"
              />
              <p className="text-[10px] text-slate-400 font-medium">Original Submission: <span className="text-slate-900 font-bold">{goal.target}</span></p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="weightage" className="text-sm font-bold text-slate-700">Adjust Weightage (%)</Label>
              <Input
                id="weightage"
                type="number"
                value={weightage}
                onChange={(e) => setWeightage(e.target.valueAsNumber || 0)}
                disabled={goal.status === "LOCKED"}
                className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 font-bold"
              />
              <p className="text-[10px] text-slate-400 font-medium">Original Submission: <span className="text-slate-900 font-bold">{goal.weightage}%</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-bold text-slate-700">Managerial Feedback</Label>
            <Textarea
              id="comment"
              placeholder="Provide strategic context for this decision..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] rounded-2xl border-slate-200 resize-none p-4"
            />
          </div>

          <Card className="border-none bg-slate-50 rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-white">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <History className="h-3 w-3" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {goal.history.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No historical actions recorded.</p>
                )}
                {goal.history.map((h) => (
                  <div key={h.id} className="relative pl-6 pb-2 border-l border-slate-200 last:border-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">
                        {h.fromStatus} → {h.toStatus}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{h.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 p-8 bg-slate-50 border-t border-slate-100">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-6 border-slate-200 hover:bg-white transition-all font-semibold"
            onClick={() => onAction("REWORK")} 
            disabled={isSubmitting}
          >
            <RotateCcw className="h-4 w-4 mr-2 text-amber-600" />
            Rework
          </Button>
          <Button 
            variant="destructive" 
            className="rounded-xl h-11 px-6 shadow-lg shadow-red-500/10 font-semibold"
            onClick={() => onAction("REJECT")} 
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-11 px-6 shadow-lg shadow-emerald-500/20 text-white font-bold"
            onClick={() => onAction("APPROVE")} 
            disabled={isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve & Lock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
