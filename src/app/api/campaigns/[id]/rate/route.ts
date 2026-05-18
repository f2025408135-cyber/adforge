/**
 * AdForge — /api/campaigns/[id]/rate
 *
 * PUT — Set a rating (1-5) on a campaign.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";
import { z } from "zod";

const userId = "demo-user"; // TODO: replace with session user id after auth

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json(
        { error: "Database unavailable in serverless mode. Features requiring persistence are disabled." },
        { status: 503 }
      );
    }
    const { id } = await params;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid rating";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: { rating: parsed.data.rating },
    });

    return NextResponse.json({ rating: campaign.rating, campaign });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to rate campaign.";
    console.error("Rate campaign error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
