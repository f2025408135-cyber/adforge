/**
 * AdForge — /api/analytics
 *
 * GET — Return aggregated analytics data computed from the database.
 * Returns JSON suitable for recharts: campaign counts, provider
 * distribution, tone distribution, and recent usage.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const userId = "demo-user"; // TODO: replace with session user id after auth

export async function GET() {
  try {
    // ── Campaign counts ───────────────────────────────────────
    const [
      totalCampaigns,
      favoriteCount,
      draftCount,
      completedCount,
      archivedCount,
    ] = await Promise.all([
      db.campaign.count({ where: { userId } }),
      db.campaign.count({ where: { userId, isFavorite: true } }),
      db.campaign.count({ where: { userId, status: "draft" } }),
      db.campaign.count({ where: { userId, status: "completed" } }),
      db.campaign.count({ where: { userId, status: "archived" } }),
    ]);

    // ── Provider distribution ─────────────────────────────────
    const providerRaw = await db.campaign.groupBy({
      by: ["provider"],
      where: { userId },
      _count: { provider: true },
    });

    const providerDistribution = providerRaw.map((item) => ({
      provider: item.provider,
      count: item._count.provider,
    }));

    // ── Tone distribution ─────────────────────────────────────
    const toneRaw = await db.campaign.groupBy({
      by: ["tone"],
      where: { userId },
      _count: { tone: true },
    });

    const toneDistribution = toneRaw.map((item) => ({
      tone: item.tone,
      count: item._count.tone,
    }));

    // ── Recent usage (last 30 days, by day) ───────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCampaigns = await db.campaign.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const usageByDate: Record<string, number> = {};
    for (const c of recentCampaigns) {
      const dateKey = c.createdAt.toISOString().split("T")[0];
      usageByDate[dateKey] = (usageByDate[dateKey] || 0) + 1;
    }

    const recentUsage = Object.entries(usageByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // ── API token usage (last 30 days, by provider) ───────────
    const recentApiUsage = await db.apiUsage.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        provider: true,
        tokensUsed: true,
        endpoint: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate tokens by provider
    const tokensByProvider: Record<string, number> = {};
    for (const usage of recentApiUsage) {
      tokensByProvider[usage.provider] = (tokensByProvider[usage.provider] || 0) + usage.tokensUsed;
    }

    const tokenUsage = Object.entries(tokensByProvider).map(([provider, tokens]) => ({
      provider,
      tokens,
    }));

    // ── Total tokens used ─────────────────────────────────────
    const totalTokens = recentApiUsage.reduce((sum, u) => sum + u.tokensUsed, 0);

    // ── Average rating ────────────────────────────────────────
    const ratedCampaigns = await db.campaign.findMany({
      where: { userId, rating: { not: null } },
      select: { rating: true },
    });

    const averageRating = ratedCampaigns.length > 0
      ? ratedCampaigns.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCampaigns.length
      : 0;

    // ── Brand kits count ──────────────────────────────────────
    const brandKitCount = await db.brandKit.count({ where: { userId } });

    return NextResponse.json({
      overview: {
        totalCampaigns,
        favoriteCount,
        draftCount,
        completedCount,
        archivedCount,
        brandKitCount,
        averageRating: Math.round(averageRating * 10) / 10,
        totalTokensUsed: totalTokens,
      },
      providerDistribution,
      toneDistribution,
      recentUsage,
      tokenUsage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics.";
    console.error("Analytics GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
