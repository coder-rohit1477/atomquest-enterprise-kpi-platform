import { ApprovalHistory, CheckInStatus, GoalStatus } from "@prisma/client";

export type ActivityEventType =
  | "goal_created"
  | "goal_edited"
  | "submitted"
  | "approved"
  | "rejected"
  | "checkin_update"
  | "manager_comment"
  | "escalation";

export interface ActivityTimelineItem {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  actor?: string;
  timestamp: string | Date;
}

export function mapApprovalHistoryToTimeline(
  history: Array<
    Pick<ApprovalHistory, "id" | "fromStatus" | "toStatus" | "comment"> & {
      createdAt: Date | string;
    }
  >
): ActivityTimelineItem[] {
  return history.map((entry) => {
    const toStatus = entry.toStatus as GoalStatus;
    const fromStatus = entry.fromStatus as GoalStatus;

    if (toStatus === "PENDING_APPROVAL") {
      return {
        id: `approval-${entry.id}`,
        type: "submitted",
        title: "Goal submitted",
        description: entry.comment || "Submitted for managerial review.",
        timestamp: entry.createdAt,
      };
    }

    if (toStatus === "LOCKED" || toStatus === "APPROVED") {
      return {
        id: `approval-${entry.id}`,
        type: "approved",
        title: "Goal approved",
        description: entry.comment || "Approved and finalized by management.",
        timestamp: entry.createdAt,
      };
    }

    if (toStatus === "REJECTED") {
      return {
        id: `approval-${entry.id}`,
        type: "rejected",
        title: "Goal rejected",
        description: entry.comment || "Rejected by management.",
        timestamp: entry.createdAt,
      };
    }

    const isRework = toStatus === "DRAFT" && fromStatus !== "DRAFT";
    return {
      id: `approval-${entry.id}`,
      type: isRework ? "goal_edited" : "goal_edited",
      title: isRework ? "Rework requested" : "Goal updated",
      description: entry.comment || "Goal moved back to draft for updates.",
      timestamp: entry.createdAt,
    };
  });
}

export function mapProgressHistoryToTimeline(
  history: Array<{
    id: string;
    progress: number;
    status: CheckInStatus | string;
    createdAt: Date | string;
  }>
): ActivityTimelineItem[] {
  return history.map((entry) => ({
    id: `progress-${entry.id}`,
    type: "checkin_update",
    title: "Check-in updated",
    description: `Progress ${Math.round(entry.progress)}% • Status ${String(entry.status).replace("_", " ")}`,
    timestamp: entry.createdAt,
  }));
}

export function mapManagerCommentToTimeline(
  managerComment: string | null | undefined,
  idSeed: string,
  createdAt?: string | Date
): ActivityTimelineItem[] {
  if (!managerComment?.trim()) return [];

  const lowered = managerComment.toLowerCase();
  const isEscalation = lowered.includes("escalat") || lowered.includes("concern");

  return [
    {
      id: `comment-${idSeed}`,
      type: isEscalation ? "escalation" : "manager_comment",
      title: isEscalation ? "Escalation flagged" : "Manager comment added",
      description: managerComment,
      timestamp: createdAt ?? new Date(),
    },
  ];
}

export function mapAuditLogToTimeline(log: {
  id: string;
  action: string;
  details?: string | null;
  createdAt: Date | string;
  userName?: string;
}): ActivityTimelineItem {
  const action = log.action.toLowerCase();
  let type: ActivityEventType = "goal_edited";
  let title = log.action;

  if (action.includes("created")) {
    type = "goal_created";
    title = "Goal created";
  } else if (action.includes("updated") || action.includes("draft")) {
    type = "goal_edited";
    title = "Goal updated";
  } else if (action.includes("submitted") || action.includes("resubmitted")) {
    type = "submitted";
    title = "Goal submitted";
  } else if (action.includes("approved")) {
    type = "approved";
    title = "Goal approved";
  } else if (action.includes("rejected")) {
    type = "rejected";
    title = "Goal rejected";
  } else if (action.includes("check-in")) {
    type = "checkin_update";
    title = "Check-in updated";
  } else if (action.includes("feedback") || action.includes("comment")) {
    type = "manager_comment";
    title = "Manager comment added";
  } else if (action.includes("escalat") || action.includes("concern")) {
    type = "escalation";
    title = "Escalation event";
  }

  return {
    id: `audit-${log.id}`,
    type,
    title,
    description: log.details || undefined,
    actor: log.userName,
    timestamp: log.createdAt,
  };
}

export function sortTimeline(items: ActivityTimelineItem[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}
