import cron from "node-cron";
import { runEscalationChecks } from "./index";

declare global {
  var __atomquestEscalationSchedulerStarted: boolean | undefined;
}

export function startEscalationScheduler() {
  if (globalThis.__atomquestEscalationSchedulerStarted) {
    return;
  }

  globalThis.__atomquestEscalationSchedulerStarted = true;

  // Run daily at 08:00 UTC.
  cron.schedule("0 8 * * *", async () => {
    try {
      const stats = await runEscalationChecks();
      console.info("[escalation] scheduled run completed", stats);
    } catch (error) {
      // Escalation execution must never impact core workflows.
      console.error("[escalation] scheduled run failed", error);
    }
  });
}
