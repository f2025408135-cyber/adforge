/**
 * AdForge — /api/campaigns/[id]/duplicate
 *
 * POST — Duplicate a campaign with "(Copy)" suffix in the product name.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";

const userId = "demo-user"; // TODO: replace with session user id after auth

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    const { id } = await params;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    // Create duplicate with "(Copy)" suffix
    const duplicate = await db.campaign.create({
      data: {
        userId,
        productName: `${existing.productName} (Copy)`,
        productDesc: existing.productDesc,
        tone: existing.tone,
        audience: existing.audience,
        platforms: existing.platforms,
        provider: existing.provider,
        headline: existing.headline,
        tagline: existing.tagline,
        adCopy: existing.adCopy,
        callToAction: existing.callToAction,
        targetAudience: existing.targetAudience,
        keyBenefits: existing.keyBenefits,
        platformVersions: existing.platformVersions,
        status: "draft",
        isFavorite: false,
        tags: existing.tags,
        notes: existing.notes,
      },
    });

    // Create initial version for the duplicate
    await db.campaignVersion.create({
      data: {
        campaignId: duplicate.id,
        version: 1,
        headline: duplicate.headline,
        tagline: duplicate.tagline,
        adCopy: duplicate.adCopy,
        callToAction: duplicate.callToAction,
        targetAudience: duplicate.targetAudience,
        keyBenefits: duplicate.keyBenefits,
        platformVersions: duplicate.platformVersions,
        changeSummary: "Duplicated from campaign " + existing.id,
      },
    });

    return NextResponse.json({ campaign: duplicate }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to duplicate campaign.";
    console.error("Duplicate campaign error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
