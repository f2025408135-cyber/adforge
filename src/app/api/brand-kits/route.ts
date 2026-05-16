/**
 * AdForge — /api/brand-kits (List + Create)
 *
 * GET  — List user's brand kits
 * POST — Create a new brand kit
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandKitSchema } from "@/lib/validations";

const userId = "demo-user"; // TODO: replace with session user id after auth

// ─── GET /api/brand-kits ───────────────────────────────────────
export async function GET() {
  try {
    const brandKits = await db.brandKit.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ brandKits });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch brand kits.";
    console.error("BrandKits GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/brand-kits ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = brandKitSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parsed.data;

    const brandKit = await db.brandKit.create({
      data: {
        userId,
        name: data.name,
        brandName: data.brandName,
        brandVoice: data.brandVoice,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logo: data.logo,
        guidelines: data.guidelines,
      },
    });

    return NextResponse.json({ brandKit }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create brand kit.";
    console.error("BrandKits POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
