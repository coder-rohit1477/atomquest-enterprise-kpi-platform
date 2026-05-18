import type { ComponentType } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  FilePlus2,
  MessageSquare,
  Send,
  TimerReset,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimelineItem, ActivityEventType } from "@/lib/activity-timeline";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  title?: string;
  items: ActivityTimelineItem[];
  isLoading?: boolean;
  maxHeightClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

const EVENT_STYLES: Record<
  ActivityEventType,
  {
    dot: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  goal_created: { dot: "bg-blue-500", icon: FilePlus2, label: "Goal Created" },
  goal_edited: { dot: "bg-indigo-500", icon: Edit3, label: "Goal Edited" },
  submitted: { dot: "bg-amber-500", icon: Send, label: "Submitted" },
  approved: { dot: "bg-emerald-500", icon: CheckCircle2, label: "Approved" },
  rejected: { dot: "bg-rose-500", icon: XCircle, label: "Rejected" },
  checkin_update: { dot: "bg-sky-500", icon: TimerReset, label: "Check-In Update" },
  manager_comment: { dot: "bg-violet-500", icon: MessageSquare, label: "Manager Comment" },
  escalation: { dot: "bg-red-600", icon: AlertTriangle, label: "Escalation" },
};

function TimelineLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-start gap-3 animate-pulse">
          <div className="mt-1 h-7 w-7 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({
  title = "Activity Timeline",
  items,
  isLoading = false,
  maxHeightClassName = "max-h-[320px]",
  emptyTitle = "No activity yet",
  emptyDescription = "Timeline activity appears as updates progress through the workflow.",
}: ActivityTimelineProps) {
  return (
    <Card className="border-none bg-slate-50 rounded-2xl overflow-hidden">
      <CardHeader className="py-4 px-6 border-b border-white">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-6 overflow-y-auto", maxHeightClassName)}>
        {isLoading ? (
          <TimelineLoading />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm font-bold text-slate-900">{emptyTitle}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const eventStyle = EVENT_STYLES[item.type];
              const Icon = eventStyle.icon;
              return (
                <div key={item.id} className="relative pl-6 pb-2 border-l border-slate-200 last:border-0 last:pb-0">
                  <div className={cn("absolute left-[-7px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white", eventStyle.dot)}>
                    <Icon className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {eventStyle.label}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                        {format(new Date(item.timestamp), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    {item.actor && (
                      <p className="text-[11px] font-bold text-slate-600">By: {item.actor}</p>
                    )}
                    <p className="text-[11px] leading-relaxed font-medium text-slate-600">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] leading-relaxed font-medium text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
