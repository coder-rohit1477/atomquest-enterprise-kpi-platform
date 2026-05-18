import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getManagerAnalyticsData } from "@/lib/admin-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getManagerAnalyticsData();
  return NextResponse.json(payload);
}
