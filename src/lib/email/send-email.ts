type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

type GoalEmailContext = {
  recipientName?: string | null;
  goalTitle: string;
  actorName?: string | null;
};

type QuarterlyReminderContext = {
  recipientName?: string | null;
  periodLabel: string;
  dashboardUrl?: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return { apiKey, from };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapTemplate(title: string, body: string) {
  return `
    <div style="background:#f8fafc;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#0f172a;color:#ffffff;padding:20px 24px;">
          <h1 style="margin:0;font-size:18px;font-weight:700;">${title}</h1>
        </div>
        <div style="padding:24px;line-height:1.6;font-size:14px;">
          ${body}
        </div>
      </div>
    </div>
  `;
}

export function buildGoalSubmittedEmail(context: GoalEmailContext) {
  const recipient = escapeHtml(context.recipientName || "Manager");
  const title = escapeHtml(context.goalTitle);
  const actor = escapeHtml(context.actorName || "An employee");
  return {
    subject: "Goal submitted for your review",
    html: wrapTemplate(
      "Goal Submitted",
      `<p>Hello ${recipient},</p>
       <p>${actor} submitted a strategic goal for approval.</p>
       <p><strong>Goal:</strong> ${title}</p>
       <p>Please review it in the manager dashboard.</p>`
    ),
  };
}

export function buildGoalApprovedEmail(context: GoalEmailContext) {
  const recipient = escapeHtml(context.recipientName || "Employee");
  const title = escapeHtml(context.goalTitle);
  const actor = escapeHtml(context.actorName || "Your manager");
  return {
    subject: "Your goal has been approved",
    html: wrapTemplate(
      "Goal Approved",
      `<p>Hello ${recipient},</p>
       <p>${actor} approved your strategic goal.</p>
       <p><strong>Goal:</strong> ${title}</p>
       <p>Your goal is now finalized for this cycle.</p>`
    ),
  };
}

export function buildGoalRejectedEmail(context: GoalEmailContext) {
  const recipient = escapeHtml(context.recipientName || "Employee");
  const title = escapeHtml(context.goalTitle);
  const actor = escapeHtml(context.actorName || "Your manager");
  return {
    subject: "Your goal needs revision",
    html: wrapTemplate(
      "Goal Rejected",
      `<p>Hello ${recipient},</p>
       <p>${actor} requested changes to your strategic goal.</p>
       <p><strong>Goal:</strong> ${title}</p>
       <p>Please review feedback and resubmit when ready.</p>`
    ),
  };
}

export function buildQuarterlyReminderEmail(context: QuarterlyReminderContext) {
  const recipient = escapeHtml(context.recipientName || "Team member");
  const period = escapeHtml(context.periodLabel);
  const url = context.dashboardUrl ? escapeHtml(context.dashboardUrl) : "/dashboard/check-ins";
  return {
    subject: `Quarterly check-in reminder: ${period}`,
    html: wrapTemplate(
      "Quarterly Reminder",
      `<p>Hello ${recipient},</p>
       <p>This is a reminder to complete your quarterly check-in for <strong>${period}</strong>.</p>
       <p>Please update your progress in the portal.</p>
       <p><a href="${url}" style="color:#2563eb;text-decoration:none;font-weight:700;">Open Check-Ins</a></p>`
    ),
  };
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { apiKey, from } = getEmailConfig();
  if (!apiKey || !from) {
    console.warn("[email] Missing RESEND_API_KEY or EMAIL_FROM. Email send skipped.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[email] Resend send failed:", response.status, responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email] Resend request error:", error);
    return false;
  }
}

export async function sendGoalSubmittedEmail(params: {
  to: string;
  recipientName?: string | null;
  goalTitle: string;
  actorName?: string | null;
}) {
  const template = buildGoalSubmittedEmail(params);
  try {
    return await sendEmail({ to: params.to, ...template });
  } catch (error) {
    console.error("[email] sendGoalSubmittedEmail failed:", error);
    return false;
  }
}

export async function sendGoalApprovedEmail(params: {
  to: string;
  recipientName?: string | null;
  goalTitle: string;
  actorName?: string | null;
}) {
  const template = buildGoalApprovedEmail(params);
  try {
    return await sendEmail({ to: params.to, ...template });
  } catch (error) {
    console.error("[email] sendGoalApprovedEmail failed:", error);
    return false;
  }
}

export async function sendGoalRejectedEmail(params: {
  to: string;
  recipientName?: string | null;
  goalTitle: string;
  actorName?: string | null;
}) {
  const template = buildGoalRejectedEmail(params);
  try {
    return await sendEmail({ to: params.to, ...template });
  } catch (error) {
    console.error("[email] sendGoalRejectedEmail failed:", error);
    return false;
  }
}

export async function sendQuarterlyReminderEmail(params: {
  to: string;
  recipientName?: string | null;
  periodLabel: string;
  dashboardUrl?: string;
}) {
  const template = buildQuarterlyReminderEmail(params);
  try {
    return await sendEmail({ to: params.to, ...template });
  } catch (error) {
    console.error("[email] sendQuarterlyReminderEmail failed:", error);
    return false;
  }
}
