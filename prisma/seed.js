/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_DOMAIN = "@atomquest.dev";
const BASE_PASSWORD = "Demo@123";
const REPORTING_YEAR = 2026;

const ORG = {
  admins: [
    { name: "Sarah Chen", email: "sarah.chen@atomquest.dev" },
    { name: "Rohit Malhotra", email: "rohit.malhotra@atomquest.dev" },
  ],
  managers: [
    { name: "Marcus Thorne", email: "marcus.thorne@atomquest.dev", unit: "Engineering" },
    { name: "Elena Rodriguez", email: "elena.rodriguez@atomquest.dev", unit: "Revenue" },
    { name: "David Kim", email: "david.kim@atomquest.dev", unit: "Finance" },
    { name: "Nadia Al-Farsi", email: "nadia.alfarsi@atomquest.dev", unit: "Operations" },
  ],
  employees: [
    { name: "Alex Rivera", email: "alex.rivera@atomquest.dev", manager: "marcus.thorne@atomquest.dev", unit: "Engineering" },
    { name: "Jordan Smith", email: "jordan.smith@atomquest.dev", manager: "marcus.thorne@atomquest.dev", unit: "Engineering" },
    { name: "Priya Nair", email: "priya.nair@atomquest.dev", manager: "marcus.thorne@atomquest.dev", unit: "Engineering" },
    { name: "Ethan Cole", email: "ethan.cole@atomquest.dev", manager: "marcus.thorne@atomquest.dev", unit: "Engineering" },
    { name: "Maya Patel", email: "maya.patel@atomquest.dev", manager: "elena.rodriguez@atomquest.dev", unit: "Revenue" },
    { name: "Liam Wilson", email: "liam.wilson@atomquest.dev", manager: "elena.rodriguez@atomquest.dev", unit: "Revenue" },
    { name: "Sofia Alvarez", email: "sofia.alvarez@atomquest.dev", manager: "elena.rodriguez@atomquest.dev", unit: "Revenue" },
    { name: "Noah Bennett", email: "noah.bennett@atomquest.dev", manager: "elena.rodriguez@atomquest.dev", unit: "Revenue" },
    { name: "Chloe Hart", email: "chloe.hart@atomquest.dev", manager: "david.kim@atomquest.dev", unit: "Finance" },
    { name: "Aarav Mehta", email: "aarav.mehta@atomquest.dev", manager: "david.kim@atomquest.dev", unit: "Finance" },
    { name: "Isla Morgan", email: "isla.morgan@atomquest.dev", manager: "david.kim@atomquest.dev", unit: "Finance" },
    { name: "Caleb Price", email: "caleb.price@atomquest.dev", manager: "david.kim@atomquest.dev", unit: "Finance" },
    { name: "Zara Khan", email: "zara.khan@atomquest.dev", manager: "nadia.alfarsi@atomquest.dev", unit: "Operations" },
    { name: "Owen Brooks", email: "owen.brooks@atomquest.dev", manager: "nadia.alfarsi@atomquest.dev", unit: "Operations" },
    { name: "Neha Kapoor", email: "neha.kapoor@atomquest.dev", manager: "nadia.alfarsi@atomquest.dev", unit: "Operations" },
    { name: "Miles Turner", email: "miles.turner@atomquest.dev", manager: "nadia.alfarsi@atomquest.dev", unit: "Operations" },
  ],
};

const SHARED_GOALS = [
  {
    title: "Enterprise Security Hardening Program",
    description: "Deliver zero-trust controls and quarterly remediation discipline across production systems.",
    thrustArea: "Operational Excellence",
    uom: "Percentage (%)",
    target: 100,
    weightage: 20,
  },
  {
    title: "Customer Reliability Improvement Initiative",
    description: "Reduce service-impact incidents and improve proactive response execution.",
    thrustArea: "Customer Satisfaction",
    uom: "Score (1-10)",
    target: 9,
    weightage: 15,
  },
];

const UNIT_GOAL_TEMPLATES = {
  Engineering: [
    { title: "Platform Availability", thrustArea: "Operational Excellence", uom: "Percentage (%)", target: 99.95, weightage: 35 },
    { title: "Deployment Throughput", thrustArea: "Innovation & Technology", uom: "Count (Units)", target: 220, weightage: 25 },
    { title: "Critical Defect Burn-down", thrustArea: "Customer Satisfaction", uom: "Count (Units)", target: 15, weightage: 20 },
  ],
  Revenue: [
    { title: "Pipeline Conversion Quality", thrustArea: "Strategic Growth", uom: "Percentage (%)", target: 42, weightage: 35 },
    { title: "Quarterly Enterprise Bookings", thrustArea: "Strategic Growth", uom: "Currency (USD)", target: 1450000, weightage: 30 },
    { title: "Account Expansion Coverage", thrustArea: "Customer Satisfaction", uom: "Count (Units)", target: 28, weightage: 20 },
  ],
  Finance: [
    { title: "Forecast Accuracy", thrustArea: "Operational Excellence", uom: "Percentage (%)", target: 97, weightage: 40 },
    { title: "Cost Optimization Delivery", thrustArea: "Sustainability", uom: "Currency (USD)", target: 450000, weightage: 30 },
    { title: "Close Cycle Time", thrustArea: "Operational Excellence", uom: "Time (Days)", target: 4, weightage: 20 },
  ],
  Operations: [
    { title: "Process Automation Index", thrustArea: "Innovation & Technology", uom: "Percentage (%)", target: 85, weightage: 35 },
    { title: "Risk Control Completion", thrustArea: "Operational Excellence", uom: "Percentage (%)", target: 95, weightage: 30 },
    { title: "Service Escalation Response", thrustArea: "Customer Satisfaction", uom: "Time (Days)", target: 2, weightage: 20 },
  ],
};

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function pickFrom(arr, idx) {
  return arr[idx % arr.length];
}

async function cleanupExistingDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true },
  });
  const userIds = demoUsers.map((u) => u.id);
  if (userIds.length === 0) return;

  await prisma.escalationLog.deleteMany({ where: { employeeId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.managerFeedback.deleteMany({ where: { managerId: { in: userIds } } });
  await prisma.sharedGoalAssignment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.goal.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
  console.log("[seed] Starting AtomQuest enterprise demo seed...");
  const hashedPassword = await bcrypt.hash(BASE_PASSWORD, 10);

  await cleanupExistingDemoData();
  console.log("[seed] Cleared previous demo data.");

  // Create admins
  const admins = [];
  for (const admin of ORG.admins) {
    const created = await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    admins.push(created);
  }

  // Create managers
  const managersByEmail = {};
  for (const manager of ORG.managers) {
    const created = await prisma.user.create({
      data: {
        name: manager.name,
        email: manager.email,
        password: hashedPassword,
        role: "MANAGER",
      },
    });
    managersByEmail[manager.email] = created;
  }

  // Create employees
  const employees = [];
  for (const emp of ORG.employees) {
    const created = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        managerId: managersByEmail[emp.manager].id,
      },
    });
    employees.push({ ...created, unit: emp.unit });
  }

  // Shared goals authored by first admin and assigned to all employees
  const sharedGoalTemplates = [];
  for (const shared of SHARED_GOALS) {
    const template = await prisma.goal.create({
      data: {
        ...shared,
        userId: admins[0].id,
        isShared: true,
        status: "APPROVED",
      },
    });
    sharedGoalTemplates.push(template);
  }

  const allEmployeeGoals = [];
  let employeeIdx = 0;

  for (const employee of employees) {
    // Assigned shared goals
    for (const template of sharedGoalTemplates) {
      await prisma.sharedGoalAssignment.create({
        data: {
          goalId: template.id,
          userId: employee.id,
        },
      });

      const child = await prisma.goal.create({
        data: {
          title: template.title,
          description: template.description,
          thrustArea: template.thrustArea,
          uom: template.uom,
          target: template.target,
          weightage: template.weightage,
          userId: employee.id,
          isShared: true,
          sharedGoalId: template.id,
          status: "LOCKED",
          managerComment: "Shared enterprise objective locked for consistent execution.",
        },
      });
      allEmployeeGoals.push(child);
    }

    // Unit-specific goals with status spread for analytics
    const templates = UNIT_GOAL_TEMPLATES[employee.unit];
    const statusPattern = pickFrom(
      [
        ["LOCKED", "PENDING_APPROVAL", "DRAFT"],
        ["APPROVED", "REJECTED", "LOCKED"],
        ["LOCKED", "APPROVED", "PENDING_APPROVAL"],
      ],
      employeeIdx
    );

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const status = statusPattern[i];
      const goal = await prisma.goal.create({
        data: {
          title: `${t.title} - ${employee.name.split(" ")[0]}`,
          description: `${employee.unit} priority objective aligned to FY${REPORTING_YEAR} enterprise portfolio outcomes.`,
          thrustArea: t.thrustArea,
          uom: t.uom,
          target: t.target,
          weightage: t.weightage,
          userId: employee.id,
          status,
          managerComment:
            status === "REJECTED"
              ? "Refine execution milestones and resubmit."
              : "Objective aligned with current enterprise operating plan.",
        },
      });
      allEmployeeGoals.push(goal);

      await prisma.approvalHistory.create({
        data: {
          goalId: goal.id,
          fromStatus: "DRAFT",
          toStatus: status === "DRAFT" ? "DRAFT" : status,
          actionBy: employee.managerId,
          comment:
            status === "PENDING_APPROVAL"
              ? "Waiting for managerial decision."
              : status === "REJECTED"
                ? "Needs refinement before approval."
                : "Approved for execution in current cycle.",
          createdAt: daysAgo(25 - i * 3),
        },
      });
    }
    employeeIdx++;
  }

  // Quarterly check-ins + progress history + manager feedback
  let qCounter = 0;
  const eligibleGoals = allEmployeeGoals.filter((g) => g.status === "APPROVED" || g.status === "LOCKED");
  for (const goal of eligibleGoals) {
    for (const quarter of [1, 2]) {
      const progress = pickFrom([32, 45, 57, 66, 74, 81, 93], qCounter + quarter);
      const status =
        progress >= 90 ? "COMPLETED" : progress >= 70 ? "ON_TRACK" : progress >= 50 ? "AT_RISK" : "DELAYED";

      const checkIn = await prisma.quarterlyCheckIn.create({
        data: {
          goalId: goal.id,
          quarter,
          year: REPORTING_YEAR,
          progress,
          accomplishments: `Quarter ${quarter}: delivered planned milestones and cross-functional follow-through for ${goal.title}.`,
          challenges:
            status === "DELAYED" || status === "AT_RISK"
              ? "Dependency delays and constrained specialist capacity impacted cycle velocity."
              : null,
          nextSteps: "Focus on risk closure, delivery acceleration, and measurable outcome completion.",
          status,
          createdAt: daysAgo(120 - quarter * 25 + (qCounter % 9)),
          updatedAt: daysAgo(118 - quarter * 25 + (qCounter % 9)),
        },
      });

      await prisma.progressHistory.create({
        data: {
          goalId: goal.id,
          progress,
          status,
          updatedBy: goal.userId,
          createdAt: checkIn.createdAt,
        },
      });

      if ((qCounter + quarter) % 3 === 0) {
        const goalOwner = employees.find((e) => e.id === goal.userId);
        if (goalOwner?.managerId) {
          await prisma.managerFeedback.create({
            data: {
              checkInId: checkIn.id,
              managerId: goalOwner.managerId,
              comment:
                status === "AT_RISK" || status === "DELAYED"
                  ? "Mitigate delivery blockers and submit a revised recovery plan."
                  : "Execution quality is strong; continue with current strategy.",
              isConcern: status === "AT_RISK" || status === "DELAYED",
              requestUpdate: status === "DELAYED",
              createdAt: daysAgo(105 - quarter * 20 + (qCounter % 7)),
            },
          });
        }
      }
    }
    qCounter++;
  }

  // Escalation logs (analytics-friendly spread)
  const escalationTypes = [
    { escalationType: "GOALS_NOT_SUBMITTED", level: 1, prefix: "Goal submission overdue" },
    { escalationType: "MANAGER_APPROVAL_OVERDUE", level: 2, prefix: "Manager approval SLA overdue" },
    { escalationType: "QUARTERLY_CHECKIN_OVERDUE", level: 2, prefix: "Quarterly check-in overdue" },
  ];

  const escalationTargets = employees.slice(0, 12);
  for (let i = 0; i < 18; i++) {
    const target = escalationTargets[i % escalationTargets.length];
    const rule = escalationTypes[i % escalationTypes.length];
    await prisma.escalationLog.create({
      data: {
        employeeId: target.id,
        escalationType: rule.escalationType,
        level: rule.level,
        message: `${rule.prefix} for ${target.name}.`,
        createdAt: daysAgo(2 + i * 2),
      },
    });
  }

  // Notifications + audit logs
  for (let i = 0; i < 36; i++) {
    const owner = pickFrom(employees, i);
    const actor = pickFrom([admins[0], admins[1], ...Object.values(managersByEmail)], i);

    await prisma.notification.create({
      data: {
        userId: owner.id,
        title: pickFrom(
          ["Goal Review Update", "Check-In Reminder", "Strategic Alignment Notice", "Escalation Alert"],
          i
        ),
        message: `Enterprise workflow event ${i + 1} generated for dashboard and analytics validation.`,
        type: pickFrom(["INFO", "WARNING", "SUCCESS", "ERROR"], i),
        isRead: i % 4 === 0,
        link: pickFrom(["/dashboard/goals", "/dashboard/check-ins", "/manager/dashboard"], i),
        createdAt: daysAgo(35 - i),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: pickFrom(
          ["Goal Submitted", "Goal Approved", "Check-In Submitted", "Manager Feedback Added", "Goal Rejected"],
          i
        ),
        entityType: pickFrom(["GOAL", "CHECK_IN", "CHECK_IN_FEEDBACK", "USER"], i),
        entityId: allEmployeeGoals[i % allEmployeeGoals.length]?.id || null,
        details: `Audit event ${i + 1}: generated for enterprise monitoring and timeline visualization.`,
        createdAt: daysAgo(40 - i),
      },
    });
  }

  const summary = {
    admins: await prisma.user.count({ where: { role: "ADMIN", email: { endsWith: DEMO_DOMAIN } } }),
    managers: await prisma.user.count({ where: { role: "MANAGER", email: { endsWith: DEMO_DOMAIN } } }),
    employees: await prisma.user.count({ where: { role: "EMPLOYEE", email: { endsWith: DEMO_DOMAIN } } }),
    goals: await prisma.goal.count(),
    checkIns: await prisma.quarterlyCheckIn.count(),
    approvals: await prisma.approvalHistory.count(),
    sharedAssignments: await prisma.sharedGoalAssignment.count(),
    escalations: await prisma.escalationLog.count(),
  };

  console.log("[seed] Completed successfully.", summary);
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
