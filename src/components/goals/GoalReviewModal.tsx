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
import { handleManagerAction, saveManagerReviewDraft } from "@/actions/goals";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, RotateCcw, MessageSquare, History, Target, Save } from "lucide-react";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import {
  mapApprovalHistoryToTimeline,
  mapManagerCommentToTimeline,
  sortTimeline,
} from "@/lib/activity-timeline";

interface GoalReviewModalProps {
  goal: Goal & { history: ApprovalHistory[] };
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export function GoalReviewModal({ goal, isOpen, onClose, onActionComplete }: GoalReviewModalProps) {
  const [target, setTarget] = useState(goal.target);
  const [weightage, setWeightage] = useState(goal.weightage);
  const [comment, setComment] = useState(goal.managerComment ?? "");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const isLocked = goal.status === "LOCKED";
  const isPendingApproval = goal.status === "PENDING_APPROVAL";
  const trimmedComment = comment.trim();
  const canSaveFeedback = trimmedComment.length > 0 && !isSavingFeedback && !isSubmittingAction;
  const timelineItems = sortTimeline([
    ...mapApprovalHistoryToTimeline(goal.history),
    ...mapManagerCommentToTimeline(goal.managerComment, goal.id, goal.updatedAt),
  ]);

  const onAction = async (action: "APPROVE" | "REJECT" | "REWORK") => {
    if (!isPendingApproval) {
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updates = action === "APPROVE" ? { target, weightage } : undefined;
      const result = await handleManagerAction(goal.id, action, comment, updates);
      if (result.success) {
        const labels = {
          APPROVE: "Goal approved and locked",
          REJECT: "Goal rejected",
          REWORK: "Rework requested",
        } as const;
        toast.success(labels[action]);
        onActionComplete();
        onClose();
      } else {
        toast.error(result.error || "Unable to process this decision. Refresh and try again.");
      }
    } catch {
      toast.error("Unable to process this decision right now. Please try again.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const onSaveFeedback = async () => {
    if (!trimmedComment) {
      toast.error("Enter feedback before saving.");
      return;
    }

    setIsSavingFeedback(true);
    try {
      const result = await saveManagerReviewDraft(goal.id, {
        comment: trimmedComment,
        ...(isLocked ? {} : { target, weightage }),
      });
      const draftResult = result as unknown as { error?: unknown; success?: boolean };
      const errorMessage =
        typeof draftResult.error === "string"
          ? draftResult.error
          : "Unable to save feedback. Please try again.";

      if (draftResult.success) {
        setComment(trimmedComment);
        toast.success("Feedback saved successfully");
        onActionComplete();
      } else {
        toast.error(errorMessage);
      }
    } catch {
      toast.error("Unable to save feedback right now. Please try again.");
    } finally {
      setIsSavingFeedback(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[95vw] max-w-2xl max-h-[90vh] flex-col overflow-y-auto rounded-2xl border-none p-0 shadow-2xl sm:rounded-3xl">
        <div className="relative shrink-0 overflow-hidden bg-slate-900 p-6 text-white sm:p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">{goal.title}</DialogTitle>
                <DialogDescription className="mt-1 font-medium text-slate-300">
                  Enterprise Performance Review • {goal.thrustArea}
                </DialogDescription>
              </div>
              <StatusBadge status={goal.status} />
            </div>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="space-y-6 pb-2 sm:space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Unit of Measure</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-slate-800">{goal.uom}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Current Status</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <History className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-800">{goal.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Goal Description
            </Label>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 italic">
              &quot;{goal.description || "No detailed description provided for this strategic goal."}&quot;
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-4 sm:grid-cols-2 sm:gap-8">
            <div className="space-y-3">
              <Label htmlFor="target" className="text-sm font-bold text-slate-700">Adjust Target</Label>
              <Input
                id="target"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.valueAsNumber || 0)}
                disabled={isLocked}
                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-[10px] font-medium text-slate-500">Original Submission: <span className="text-slate-900 font-bold">{goal.target}</span></p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="weightage" className="text-sm font-bold text-slate-700">Adjust Weightage (%)</Label>
              <Input
                id="weightage"
                type="number"
                value={weightage}
                onChange={(e) => setWeightage(e.target.valueAsNumber || 0)}
                disabled={isLocked}
                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-[10px] font-medium text-slate-500">Original Submission: <span className="text-slate-900 font-bold">{goal.weightage}%</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-bold text-slate-700">Managerial Feedback</Label>
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              Feedback remains editable even when the goal itself is locked.
            </p>
            <Textarea
              id="comment"
              placeholder="Provide strategic context for this decision..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px] resize-none rounded-2xl border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-start">
            <Button 
              onClick={onSaveFeedback}
              className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              disabled={!canSaveFeedback}
            >
              {isSavingFeedback ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              {isSavingFeedback ? "Saving..." : "Save Feedback"}
            </Button>
          </div>

          <ActivityTimeline
            title="Review Activity Timeline"
            items={timelineItems}
            maxHeightClassName="max-h-[260px] sm:max-h-[280px]"
            emptyTitle="No review activity yet"
            emptyDescription="Goal lifecycle events will appear here as decisions and comments are recorded."
          />
        </div>
        </div>

        {isPendingApproval && (
          <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:p-6 lg:p-8">
            <Button 
              variant="outline" 
              className="h-11 rounded-xl border-slate-200 px-6 font-semibold text-slate-800 transition-all hover:bg-white disabled:opacity-60"
              onClick={() => onAction("REWORK")} 
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4 text-amber-600" />}
              Request Rework
            </Button>
            <Button 
              variant="destructive" 
              className="h-11 rounded-xl bg-red-600 px-6 font-semibold text-white shadow-lg shadow-red-500/15 hover:bg-red-700 disabled:opacity-60"
              onClick={() => onAction("REJECT")} 
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Goal
            </Button>
            <Button 
              className="h-11 rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
              onClick={() => onAction("APPROVE")} 
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Approve Goal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
