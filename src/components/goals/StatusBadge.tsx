import { Badge } from "@/components/ui/badge";
import { GoalStatus, CheckInStatus } from "@prisma/client";

const goalStatusConfig: Record<GoalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  LOCKED: { label: "Locked & Approved", variant: "default" },
};

const checkInStatusConfig: Record<CheckInStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  ON_TRACK: { label: "On Track", variant: "success" },
  AT_RISK: { label: "At Risk", variant: "warning" },
  DELAYED: { label: "Delayed", variant: "destructive" },
  COMPLETED: { label: "Completed", variant: "info" },
};

export function StatusBadge({ status }: { status: GoalStatus | CheckInStatus }) {
  const config = (goalStatusConfig[status as GoalStatus] || checkInStatusConfig[status as CheckInStatus]);
  
  if (!config) return null;

  return (
    <Badge variant={config.variant} className="px-3 py-1 rounded-lg font-black uppercase text-[10px] tracking-widest border-none shadow-sm">
      {config.label}
    </Badge>
  );
}
