export type EscalationType =
  | "GOALS_NOT_SUBMITTED"
  | "MANAGER_APPROVAL_OVERDUE"
  | "QUARTERLY_CHECKIN_OVERDUE";

export interface EscalationRunStats {
  scannedEmployees: number;
  logsCreated: number;
  failures: number;
}
