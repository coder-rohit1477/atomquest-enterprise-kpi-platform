"use client";

import { useEffect, useState } from "react";

import type {
  ManagerAnalyticsResponse,
  OverviewAnalyticsResponse,
  QuarterlyAnalyticsResponse,
} from "@/lib/admin-analytics";
import {
  AnalyticsSkeleton,
  DepartmentHeatmapCard,
  GoalStatusPieCard,
  KpiGrid,
  ManagerEffectivenessCard,
  QuarterlyTrendCard,
} from "./AnalyticsWidgets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsPayload = {
  overview: OverviewAnalyticsResponse | null;
  quarterly: QuarterlyAnalyticsResponse | null;
  managers: ManagerAnalyticsResponse | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return (await response.json()) as T;
}

export function AdminAnalyticsDashboard() {
  const [payload, setPayload] = useState<AnalyticsPayload>({
    overview: null,
    quarterly: null,
    managers: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [overview, quarterly, managers] = await Promise.all([
          fetchJson<OverviewAnalyticsResponse>("/api/analytics/overview"),
          fetchJson<QuarterlyAnalyticsResponse>("/api/analytics/quarterly"),
          fetchJson<ManagerAnalyticsResponse>("/api/analytics/managers"),
        ]);

        if (!isActive) return;
        setPayload({ overview, quarterly, managers });
      } catch {
        if (!isActive) return;
        setError("Analytics could not be loaded right now.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading && !payload.overview && !payload.quarterly && !payload.managers) {
    return <AnalyticsSkeleton />;
  }

  if (error || !payload.overview || !payload.quarterly || !payload.managers) {
    return (
      <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <CardHeader className="p-8">
          <CardTitle className="text-xl font-black text-slate-900">Analytics Unavailable</CardTitle>
          <CardDescription className="font-medium text-slate-500">
            The admin analytics module is isolated from existing workflows. Try reloading this page to request fresh aggregated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm font-medium text-slate-600">
            {error ?? "No analytics payload was returned by the server."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <KpiGrid items={payload.overview.kpis} />

      <div className="grid gap-6 lg:grid-cols-7">
        <GoalStatusPieCard statusData={payload.overview.statusDistribution} />
        <QuarterlyTrendCard trend={payload.quarterly.trend} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ManagerEffectivenessCard managers={payload.managers.managers} />
        <DepartmentHeatmapCard
          rows={payload.overview.departmentHeatmap}
          reportingYear={payload.overview.reportingYear}
        />
      </div>
    </div>
  );
}
