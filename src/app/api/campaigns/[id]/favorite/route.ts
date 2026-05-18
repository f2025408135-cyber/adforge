/**
 * AdForge — /api/campaigns/[id]/favorite
 *
 * PUT — Toggle the isFavorite flag on a campaign.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";

const userId = "demo-user"; // TODO: replace with session user id after auth

export async function PUT(
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

    const campaign = await db.campaign.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    });

    return NextResponse.json({
      isFavorite: campaign.isFavorite,
      campaign,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle favorite.";
    console.error("Toggle favorite error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
