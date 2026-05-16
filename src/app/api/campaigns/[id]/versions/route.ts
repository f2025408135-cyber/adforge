/**
 * AdForge — /api/campaigns/[id]/versions
 *
 * GET  — List version history for a campaign.
 * POST — Create a new version entry for a campaign.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const userId = "demo-user"; // TODO: replace with session user id after auth

const versionCreateSchema = z.object({
  headline: z.string().optional(),
  tagline: z.string().optional(),
  adCopy: z.string().optional(),
  callToAction: z.string().optional(),
  targetAudience: z.string().optional(),
  keyBenefits: z.string().optional(),
  platformVersions: z.string().optional(),
  changeSummary: z.string().optional(),
});

// ─── GET /api/campaigns/[id]/versions ──────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const versions = await db.campaignVersion.findMany({
      where: { campaignId: id },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({ versions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch versions.";
    console.error("Versions GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/campaigns/[id]/versions ─────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = versionCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Get current max version
    const latestVersion = await db.campaignVersion.findFirst({
      where: { campaignId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    const version = await db.campaignVersion.create({
      data: {
        campaignId: id,
        version: nextVersion,
        headline: parsed.data.headline ?? campaign.headline,
        tagline: parsed.data.tagline ?? campaign.tagline,
        adCopy: parsed.data.adCopy ?? campaign.adCopy,
        callToAction: parsed.data.callToAction ?? campaign.callToAction,
        targetAudience: parsed.data.targetAudience ?? campaign.targetAudience,
        keyBenefits: parsed.data.keyBenefits ?? campaign.keyBenefits,
        platformVersions: parsed.data.platformVersions ?? campaign.platformVersions,
        changeSummary: parsed.data.changeSummary,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create version.";
    console.error("Versions POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
