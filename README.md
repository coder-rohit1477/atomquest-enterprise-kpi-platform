# AtomQuest Enterprise KPI Portal

> **Hackathon Submission**: Enterprise Goal Setting, Quarterly Execution Tracking, Governance, and Escalation Intelligence.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](#)

## 🚀 Problem Statement
Modern organizations struggle with fragmented KPI ownership, delayed goal approvals, weak quarterly execution visibility, and limited governance signals.  
**AtomQuest** solves this with a role-aware enterprise platform that unifies goal lifecycle management, check-ins, escalations, and analytics in one system.

## ✨ Key Features
- Role-based experience for `EMPLOYEE`, `MANAGER`, and `ADMIN`.
- End-to-end goal workflow: draft, submit, review, approve/reject/rework, lock.
- Quarterly check-ins with progress, status, accomplishments, and manager feedback.
- Shared strategic goals assignable across teams.
- Escalation engine + escalation dashboard for operational follow-through.
- Enterprise analytics and reporting dashboards.
- Audit logging and notification center for governance traceability.

## 🧩 Good-to-Have Features Implemented
- Activity timelines (goal, review, audit).
- Admin governance/reports command pages.
- Seeded enterprise demo data for judges and reviewers.
- Defensive reliability hardening (error boundaries, loading fallbacks, validation guards).
- Responsive modal/dialog UX patterns for laptop/tablet/mobile.

## 🏗️ Architecture Overview
| Layer | Responsibilities |
|---|---|
| Next.js App Router | Route segmentation by role/module, server rendering, loading/error boundaries |
| Auth + RBAC | NextAuth session + role checks for protected pages/actions |
| Domain Actions | Goal/check-in/escalation/audit operations in server actions |
| Data Layer | Prisma ORM on PostgreSQL (Neon) |
| UI Layer | Tailwind + componentized dashboards/forms/modals |
| Ops & Delivery | Vercel deployment, Prisma migrations/generate, seed workflows |

### RBAC Model
| Role | Scope |
|---|---|
| Employee | Create/edit goals, submit quarterly check-ins, view feedback |
| Manager | Review/approve goals, provide check-in feedback, team oversight |
| Admin | User governance, escalation oversight, analytics, reports, audit visibility |

### Workflow Focus
1. **Goal Workflow**: Employee drafts goals → submits at 100% weightage → manager reviews → approval locks goals.
2. **Quarterly Check-ins**: Employees update progress by quarter with status context and narrative.
3. **Escalation Engine**: Detects overdue submission/approval/check-in conditions and logs escalation events.
4. **Analytics Dashboard**: Aggregates cross-functional KPIs, trend views, manager effectiveness signals.

## 🛠️ Tech Stack
| Category | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Next.js Server Actions, NextAuth |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Charts | Recharts |
| Email | Resend |
| Deployment | Vercel |

## 👥 User Roles
| Role | Primary Modules |
|---|---|
| Employee | Dashboard, Goals, Check-Ins, Notifications |
| Manager | Approval Queue, Team Goals, Manager Check-Ins |
| Admin | Users, Logs, Escalations, Governance, Reports, Analytics |

## 🔄 Workflow Walkthrough
1. Employee creates strategic goals with weighted allocation.
2. Submission gate enforces full portfolio readiness (weightage checks).
3. Manager performs approval decisioning and contextual feedback.
4. Approved/locked goals move into quarterly execution tracking.
5. Check-in and feedback updates feed analytics and governance views.
6. Escalation records surface overdue operational events to admin.

## 📊 Analytics & Escalation Highlights
- Multi-surface analytics for status, completion trends, and managerial effectiveness.
- Escalation log stream with type, level, actor context, and timestamp.
- Governance indicators to support operational compliance tracking.

## 🖼️ Screenshots (Placeholders)
Add screenshots at the following paths:
- `/public/screenshots/dashboard.png`
- `/public/screenshots/goals.png`
- `/public/screenshots/checkins.png`
- `/public/screenshots/manager-review.png`
- `/public/screenshots/admin-analytics.png`
- `/public/screenshots/admin-escalations.png`
- `/public/screenshots/admin-governance.png`

Example markdown:
```md
![Dashboard](/public/screenshots/dashboard.png)
```

## ⚙️ Environment Setup
Create `.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
AUTH_SECRET=<random-secure-secret>
AUTH_TRUST_HOST=true
RESEND_API_KEY=<resend-api-key>
NEXTAUTH_URL=http://localhost:3000
```

## 🧪 Local Setup
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run build
npm run dev
```

## 🌱 Demo Data & Credentials
Seed realistic demo data:
```bash
npx prisma db seed
# or (direct)
node prisma/seed.js
```

Default seeded password:
- `Demo@123`

Sample accounts:
| Role | Email |
|---|---|
| Admin | `sarah.chen@atomquest.dev` |
| Admin | `rohit.malhotra@atomquest.dev` |
| Manager | `marcus.thorne@atomquest.dev` |
| Manager | `elena.rodriguez@atomquest.dev` |
| Employee | `alex.rivera@atomquest.dev` |
| Employee | `maya.patel@atomquest.dev` |

## 🚢 Deployment (Neon + Prisma + Vercel)
### 1) Neon (PostgreSQL)
1. Create a Neon project/database.
2. Copy connection string to `DATABASE_URL`.

### 2) Prisma
```bash
npx prisma generate
npx prisma migrate deploy
```

### 3) Vercel
1. Import repo into Vercel.
2. Configure environment variables from `.env`.
3. Set build command: `npm run build`.
4. Deploy.

## 🗂️ Folder Structure
```text
src/
  app/
    (portal)/
      admin/
      dashboard/
      manager/
      reports/
  actions/
  components/
    admin/
    goals/
    layout/
    ui/
  lib/
    escalation/
prisma/
  schema.prisma
  seed.js
scripts/
  seed-escalations.ts
```

## ✅ Hackathon Evaluation Alignment
| Evaluation Axis | Delivery in AtomQuest |
|---|---|
| Functionality | End-to-end goal lifecycle, check-ins, feedback, governance |
| BRD Adherence | Role-aware workflows, approvals, locked goals, timeline traceability |
| Analytics | Admin analytics and report surfaces with KPI rollups |
| Escalation Engine | Automated overdue detection + escalation logging dashboard |
| Governance | Audit logs, governance command pages, operational indicators |
| Responsiveness | Mobile/tablet/laptop hardened enterprise UI patterns |

## 🧭 Future Improvements
- Multi-cycle planning and fiscal-year templates.
- Fine-grained notification preferences.
- CSV/PDF advanced report exports with scheduling.
- SSO/SAML enterprise auth integration.
- SLA-based escalation policy builder UI.

## 🤝 Contributors
- AtomQuest Hackathon Team

---

If you are a judge/reviewer: seed data + demo credentials are designed for immediate end-to-end walkthrough.
