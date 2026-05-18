/**
 * AdForge — /api/campaigns (List + Create)
 *
 * GET  — List user's campaigns with pagination, search, and filters.
 * POST — Create a new campaign from a generated result.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";
import { campaignCreateSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

const userId = "demo-user"; // TODO: replace with session user id after auth

// ─── GET /api/campaigns ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({
        campaigns: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    }
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));
    const search = searchParams.get("search") || "";
    const tone = searchParams.get("tone") || "";
    const provider = searchParams.get("provider") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const favorite = searchParams.get("favorite");

    // Build where clause
    const where: Prisma.CampaignWhereInput = {
      userId,
      ...(search && {
        OR: [
          { productName: { contains: search } },
          { productDesc: { contains: search } },
          { headline: { contains: search } },
          { tagline: { contains: search } },
          { adCopy: { contains: search } },
        ],
      }),
      ...(tone && { tone }),
      ...(provider && { provider }),
      ...(status && { status }),
      ...(favorite === "true" && { isFavorite: true }),
    };

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { versions: true } },
        },
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch campaigns.";
    console.error("Campaigns GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/campaigns ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json(
        { error: "Database unavailable. Campaign saving requires a database connection." },
        { status: 503 }
      );
    }
    const body = await req.json();

    // ── Validate input ────────────────────────────────────────
    const parsed = campaignCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parsed.data;

    const campaign = await db.campaign.create({
      data: {
        userId,
        productName: data.productName,
        productDesc: data.productDesc,
        tone: data.tone,
        audience: data.audience,
        platforms: data.platforms.join(","),
        provider: data.provider,
        headline: data.headline,
        tagline: data.tagline,
        adCopy: data.adCopy,
        callToAction: data.callToAction,
        targetAudience: data.targetAudience,
        keyBenefits: data.keyBenefits,
        platformVersions: data.platformVersions,
        status: data.status,
        tags: data.tags,
        rating: data.rating,
        notes: data.notes,
      },
    });

    // Create initial version entry
    await db.campaignVersion.create({
      data: {
        campaignId: campaign.id,
        version: 1,
        headline: campaign.headline,
        tagline: campaign.tagline,
        adCopy: campaign.adCopy,
        callToAction: campaign.callToAction,
        targetAudience: campaign.targetAudience,
        keyBenefits: campaign.keyBenefits,
        platformVersions: campaign.platformVersions,
        changeSummary: "Initial campaign creation",
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create campaign.";
    console.error("Campaigns POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
