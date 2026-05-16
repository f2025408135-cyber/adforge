/**
 * AdForge — Analytics React Query Hook
 *
 * Data-fetching hook for the analytics API.
 */

"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────
export interface AnalyticsOverview {
  totalCampaigns: number;
  favoriteCount: number;
  draftCount: number;
  completedCount: number;
  archivedCount: number;
  brandKitCount: number;
  averageRating: number;
  totalTokensUsed: number;
}

export interface ProviderDistribution {
  provider: string;
  count: number;
}

export interface ToneDistribution {
  tone: string;
  count: number;
}

export interface RecentUsage {
  date: string;
  count: number;
}

export interface TokenUsage {
  provider: string;
  tokens: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  providerDistribution: ProviderDistribution[];
  toneDistribution: ToneDistribution[];
  recentUsage: RecentUsage[];
  tokenUsage: TokenUsage[];
}

// ── Query key ────────────────────────────────────────────────
export const analyticsKeys = {
  all: ["analytics"] as const,
};

// ── Fetch helper ─────────────────────────────────────────────
async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/analytics");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch analytics");
  }
  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────

/** GET /api/analytics — Fetch aggregated analytics data */
export function useAnalytics(
  options?: Omit<
    UseQueryOptions<
      AnalyticsData,
      Error,
      AnalyticsData,
      ReturnType<typeof analyticsKeys.all>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: analyticsKeys.all,
    queryFn: fetchAnalytics,
    ...options,
  });
}
