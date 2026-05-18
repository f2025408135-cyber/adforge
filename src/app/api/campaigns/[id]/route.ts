/**
 * AdForge — /api/campaigns/[id] (Single Campaign CRUD)
 *
 * GET    — Fetch a single campaign by ID
 * PUT    — Update campaign fields
 * DELETE — Delete a campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";

const userId = "demo-user"; // TODO: replace with session user id after auth

// ─── GET /api/campaigns/[id] ───────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: "desc" } },
        exports: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch campaign.";
    console.error("Campaign GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PUT /api/campaigns/[id] ───────────────────────────────────
export async function PUT(
  req: NextRequest,
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

    const body = await req.json();
    const allowedFields = [
      "productName", "productDesc", "tone", "audience", "platforms",
      "provider", "headline", "tagline", "adCopy", "callToAction",
      "targetAudience", "keyBenefits", "platformVersions", "status",
      "isFavorite", "tags", "rating", "notes",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "platforms" && Array.isArray(body[field])) {
          updateData[field] = body[field].join(",");
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ campaign });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update campaign.";
    console.error("Campaign PUT error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/campaigns/[id] ────────────────────────────────
export async function DELETE(
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

    await db.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete campaign.";
    console.error("Campaign DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
