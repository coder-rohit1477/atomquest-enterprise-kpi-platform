import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

type EscalationSeedType =
  | "GOALS_NOT_SUBMITTED"
  | "MANAGER_APPROVAL_OVERDUE"
  | "QUARTERLY_CHECKIN_OVERDUE";

interface CandidateEscalation {
  employeeId: string;
  escalationType: EscalationSeedType;
  level: number;
  message: string;
  createdAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const OFFSETS_DAYS = [2, 4, 7, 11, 15, 22, 30];
const TARGET_MIN_LOGS = 12;
const TARGET_MAX_LOGS = 18;

function loadLocalEnvIfNeeded() {
  if (process.env.DATABASE_URL) return;

  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

function withTimeJitter(date: Date, seed: number) {
  const copy = new Date(date);
  const hour = 9 + (seed % 9);
  const minute = (seed * 13) % 60;
  copy.setUTCHours(hour, minute, 0, 0);
  return copy;
}

function pickOffset(index: number) {
  return OFFSETS_DAYS[index % OFFSETS_DAYS.length];
}

async function findExistingForSameDay(
  prisma: PrismaClient,
  candidate: CandidateEscalation
) {
  return prisma.escalationLog.findFirst({
    where: {
      employeeId: candidate.employeeId,
      escalationType: candidate.escalationType,
      level: candidate.level,
      createdAt: {
        gte: startOfUtcDay(candidate.createdAt),
        lte: endOfUtcDay(candidate.createdAt),
      },
    },
    select: { id: true },
  });
}

async function seedEscalations() {
  loadLocalEnvIfNeeded();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const employees = await prisma.user.findMany({
      where: { role: Role.EMPLOYEE },
      select: {
        id: true,
        name: true,
        goals: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            checkIns: {
              orderBy: { createdAt: "desc" },
              select: { id: true, quarter: true, year: true, createdAt: true },
              take: 3,
            },
          },
        },
      },
    });

    const pendingGoals = await prisma.goal.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { updatedAt: "asc" },
      select: { id: true, title: true, userId: true, updatedAt: true },
      take: 20,
    });

    const approvalCandidates = pendingGoals.length
      ? pendingGoals
      : (
          await prisma.goal.findMany({
            where: { status: { in: ["DRAFT", "REJECTED", "APPROVED", "LOCKED"] } },
            orderBy: { updatedAt: "asc" },
            select: { id: true, title: true, userId: true, updatedAt: true },
            take: 12,
          })
        ).map((goal) => ({ ...goal }));

    const candidates: CandidateEscalation[] = [];

    let cursor = 0;
    for (const employee of employees) {
      const hasNoGoals = employee.goals.length === 0;
      const hasOnlyUnsubmitted = employee.goals.every(
        (goal) => goal.status === "DRAFT" || goal.status === "REJECTED"
      );

      if (hasNoGoals || hasOnlyUnsubmitted) {
        const offset = pickOffset(cursor++);
        candidates.push({
          employeeId: employee.id,
          escalationType: "GOALS_NOT_SUBMITTED",
          level: 1,
          message: "Development seed: employee has not submitted goals for current cycle.",
          createdAt: withTimeJitter(dateDaysAgo(offset), cursor),
        });
      }
    }

    if (candidates.filter((c) => c.escalationType === "GOALS_NOT_SUBMITTED").length === 0) {
      for (let i = 0; i < Math.min(4, employees.length); i++) {
        candidates.push({
          employeeId: employees[i].id,
          escalationType: "GOALS_NOT_SUBMITTED",
          level: 1,
          message: "Development seed: overdue goal submission warning.",
          createdAt: withTimeJitter(dateDaysAgo(pickOffset(cursor++)), cursor),
        });
      }
    }

    for (let i = 0; i < Math.min(8, approvalCandidates.length); i++) {
      const goal = approvalCandidates[i];
      const offset = pickOffset(cursor++);
      candidates.push({
        employeeId: goal.userId,
        escalationType: "MANAGER_APPROVAL_OVERDUE",
        level: 2,
        message: `Development seed: manager approval overdue for goal "${goal.title}".`,
        createdAt: withTimeJitter(dateDaysAgo(offset), cursor),
      });
    }

    const checkInCandidates = employees
      .flatMap((employee) =>
        employee.goals
          .filter((goal) => goal.status === "APPROVED" || goal.status === "LOCKED")
          .map((goal) => ({ employeeId: employee.id, goalTitle: goal.title, hasCheckIns: goal.checkIns.length > 0 }))
      )
      .filter((entry) => !entry.hasCheckIns);

    const selectedCheckInCandidates =
      checkInCandidates.length > 0
        ? checkInCandidates.slice(0, 12)
        : employees
            .flatMap((employee) =>
              employee.goals.slice(0, 1).map((goal) => ({ employeeId: employee.id, goalTitle: goal.title }))
            )
            .slice(0, 8);

    for (const entry of selectedCheckInCandidates) {
      candidates.push({
        employeeId: entry.employeeId,
        escalationType: "QUARTERLY_CHECKIN_OVERDUE",
        level: 2,
        message: `Development seed: quarterly check-in overdue for goal "${entry.goalTitle}".`,
        createdAt: withTimeJitter(dateDaysAgo(pickOffset(cursor++)), cursor),
      });
    }

    if (employees.length > 0 && candidates.length < TARGET_MIN_LOGS) {
      const fallbackTypes: Array<{
        type: EscalationSeedType;
        level: number;
        message: string;
      }> = [
        {
          type: "GOALS_NOT_SUBMITTED",
          level: 1,
          message: "Development seed: employee goal submission pending beyond expected timeline.",
        },
        {
          type: "MANAGER_APPROVAL_OVERDUE",
          level: 2,
          message: "Development seed: manager approval pending beyond SLA.",
        },
        {
          type: "QUARTERLY_CHECKIN_OVERDUE",
          level: 2,
          message: "Development seed: quarterly check-in pending beyond reporting window.",
        },
      ];

      let fillCursor = 0;
      while (candidates.length < TARGET_MIN_LOGS) {
        const employee = employees[fillCursor % employees.length];
        const preset = fallbackTypes[fillCursor % fallbackTypes.length];
        candidates.push({
          employeeId: employee.id,
          escalationType: preset.type,
          level: preset.level,
          message: preset.message,
          createdAt: withTimeJitter(dateDaysAgo(pickOffset(cursor + fillCursor) + fillCursor), fillCursor),
        });
        fillCursor++;
      }
    }

    const boundedCandidates = candidates.slice(0, TARGET_MAX_LOGS);

    let inserted = 0;
    let skipped = 0;
    const localDedup = new Set<string>();

    for (const [index, baseCandidate] of boundedCandidates.entries()) {
      let candidate = baseCandidate;
      let existing = await findExistingForSameDay(prisma, candidate);

      let attempt = 0;
      while (existing && attempt < 3) {
        attempt++;
        const shiftedDate = withTimeJitter(
          dateDaysAgo(pickOffset(index + attempt) + attempt),
          index + attempt
        );
        candidate = { ...baseCandidate, createdAt: shiftedDate };
        existing = await findExistingForSameDay(prisma, candidate);
      }

      const dedupKey = [
        candidate.employeeId,
        candidate.escalationType,
        candidate.level,
        startOfUtcDay(candidate.createdAt).toISOString(),
      ].join("|");

      if (localDedup.has(dedupKey)) {
        skipped++;
        continue;
      }

      if (existing) {
        skipped++;
        continue;
      }

      localDedup.add(dedupKey);
      await prisma.escalationLog.create({
        data: {
          employeeId: candidate.employeeId,
          escalationType: candidate.escalationType,
          level: candidate.level,
          message: candidate.message,
          createdAt: candidate.createdAt,
        },
      });
      inserted++;
    }

    const totalLogs = await prisma.escalationLog.count();
    console.info(
      `[seed-escalations] complete: inserted=${inserted}, skipped=${skipped}, candidates=${boundedCandidates.length}, total_logs=${totalLogs}`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedEscalations()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("[seed-escalations] failed", error);
    process.exit(1);
  });
