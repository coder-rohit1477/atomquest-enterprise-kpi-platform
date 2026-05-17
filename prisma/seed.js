const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding enriched enterprise demo data...");

  const hashedPassword = await bcrypt.hash("Demo@123", 10);

  // Clear existing data
  console.log("Cleaning up existing data...");
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.managerFeedback.deleteMany({});
  await prisma.quarterlyCheckIn.deleteMany({});
  await prisma.progressHistory.deleteMany({});
  await prisma.approvalHistory.deleteMany({});
  await prisma.sharedGoalAssignment.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Admins
  const admin = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "admin@atomquest.dev",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 2. Create Managers for different departments
  const managersData = [
    { name: "Marcus Thorne", email: "marcus.t@atomquest.dev", role: "MANAGER" }, // Engineering
    { name: "Elena Rodriguez", email: "elena.r@atomquest.dev", role: "MANAGER" }, // Sales
    { name: "David Kim", email: "david.k@atomquest.dev", role: "MANAGER" }, // Finance
  ];

  const createdManagers = [];
  for (const m of managersData) {
    const manager = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        password: hashedPassword,
        role: m.role,
      },
    });
    createdManagers.push(manager);
  }

  // 3. Create Employees
  const employeesData = [
    { name: "Alex Rivera", email: "alex.r@atomquest.dev", managerId: createdManagers[0].id },
    { name: "Jordan Smith", email: "jordan.s@atomquest.dev", managerId: createdManagers[0].id },
    { name: "Maya Patel", email: "maya.p@atomquest.dev", managerId: createdManagers[1].id },
    { name: "Liam Wilson", email: "liam.w@atomquest.dev", managerId: createdManagers[2].id },
  ];

  const createdEmployees = [];
  for (const e of employeesData) {
    const employee = await prisma.user.create({
      data: {
        name: e.name,
        email: e.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        managerId: e.managerId,
      },
    });
    createdEmployees.push(employee);
  }

  // 4. Create a Shared Goal (Corporate Strategic Objective)
  console.log("Creating Shared Goal...");
  const sharedGoalTemplate = await prisma.goal.create({
    data: {
      title: "Enterprise Security Hardening",
      description: "Implement zero-trust architecture and SOC2 compliance automation across all cloud environments.",
      thrustArea: "Strategic Growth",
      uom: "Compliance Score",
      target: 100,
      weightage: 20,
      userId: admin.id,
      isShared: true,
      status: "APPROVED"
    }
  });

  for (const emp of createdEmployees) {
      await prisma.sharedGoalAssignment.create({
          data: {
              goalId: sharedGoalTemplate.id,
              userId: emp.id
          }
      });

      const empGoal = await prisma.goal.create({
          data: {
              title: sharedGoalTemplate.title,
              description: sharedGoalTemplate.description,
              thrustArea: sharedGoalTemplate.thrustArea,
              uom: sharedGoalTemplate.uom,
              target: sharedGoalTemplate.target,
              weightage: sharedGoalTemplate.weightage,
              userId: emp.id,
              isShared: true,
              sharedGoalId: sharedGoalTemplate.id,
              status: "LOCKED"
          }
      });

      // Add Check-in for shared goal
      await prisma.quarterlyCheckIn.create({
          data: {
              goalId: empGoal.id,
              quarter: 2,
              year: 2026,
              progress: Math.floor(Math.random() * 40) + 10,
              accomplishments: "Completed initial audit of IAM policies and provisioned automated scanning tools.",
              status: "ON_TRACK"
          }
      });
  }

  // 5. Departmental Goals
  const deptGoals = {
    Engineering: [
      { title: "Infrastructure Scalability", uom: "Req/Sec", target: 50000, weightage: 30, accomplishments: "Provisioned new k8s clusters in EU-West." },
      { title: "Deployment Velocity", uom: "Deploys/Day", target: 15, weightage: 25, accomplishments: "Fully automated the staging environment pipeline." },
    ],
    Sales: [
      { title: "Market Expansion (EMEA)", uom: "Revenue ($)", target: 2000000, weightage: 50, accomplishments: "Closed three anchor accounts in Germany." },
    ]
  };

  for (const emp of createdEmployees) {
    const manager = createdManagers.find(m => m.id === emp.managerId);
    const dept = emp.email.includes("alex") || emp.email.includes("jordan") ? "Engineering" : emp.email.includes("maya") ? "Sales" : "Finance";
    const templates = deptGoals[dept] || [{ title: "Operational Excellence", uom: "Efficiency %", target: 95, weightage: 30 }];

    for (const t of templates) {
        const goal = await prisma.goal.create({
            data: {
                title: t.title,
                description: `High-priority objective for ${dept} department.`,
                thrustArea: dept === "Engineering" ? "Operational Excellence" : "Strategic Growth",
                uom: t.uom,
                target: t.target,
                weightage: t.weightage,
                userId: emp.id,
                status: "APPROVED",
                managerComment: "Strategic alignment confirmed for current fiscal cycle."
            }
        });

        // Add History
        await prisma.approvalHistory.create({
            data: {
                goalId: goal.id,
                fromStatus: "PENDING_APPROVAL",
                toStatus: "APPROVED",
                actionBy: manager.id,
                comment: "Objective validated and locked for execution."
            }
        });

        // Add Check-ins
        await prisma.quarterlyCheckIn.create({
            data: {
                goalId: goal.id,
                quarter: 2,
                year: 2026,
                progress: Math.floor(Math.random() * 60) + 20,
                accomplishments: t.accomplishments || "Met initial quarterly milestones.",
                status: "ON_TRACK"
            }
        });
    }
  }

  // 6. Audit Logs
  console.log("Seeding Audit Logs...");
  const auditEntries = [
    { action: "Goal Approved", entityType: "GOAL", details: "Infrastructure Scalability validated by Marcus Thorne" },
    { action: "Shared Goal Created", entityType: "GOAL", details: "Enterprise Security Hardening deployed by Sarah Chen" },
    { action: "Check-In Submitted", entityType: "CHECK_IN", details: "Q2 Update for Alex Rivera" },
    { action: "User Role Updated", entityType: "USER", details: "Alex Rivera promoted to Lead Engineer" },
  ];

  for (const entry of auditEntries) {
      await prisma.auditLog.create({
          data: {
              ...entry,
              userId: admin.id,
          }
      });
  }

  console.log("Seeding enriched enterprise demo data finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
