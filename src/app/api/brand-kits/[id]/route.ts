/**
 * AdForge — /api/brand-kits/[id]
 *
 * GET    — Fetch a single brand kit
 * PUT    — Update a brand kit
 * DELETE — Delete a brand kit
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";
import { brandKitSchema } from "@/lib/validations";

const userId = "demo-user"; // TODO: replace with session user id after auth

// ─── GET /api/brand-kits/[id] ──────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    const { id } = await params;

    const brandKit = await db.brandKit.findUnique({ where: { id } });
    if (!brandKit || brandKit.userId !== userId) {
      return NextResponse.json({ error: "Brand kit not found." }, { status: 404 });
    }

    return NextResponse.json({ brandKit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch brand kit.";
    console.error("BrandKit GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PUT /api/brand-kits/[id] ──────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    const { id } = await params;

    const existing = await db.brandKit.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Brand kit not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = brandKitSchema.partial().safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const brandKit = await db.brandKit.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ brandKit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update brand kit.";
    console.error("BrandKit PUT error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/brand-kits/[id] ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    const { id } = await params;

    const existing = await db.brandKit.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Brand kit not found." }, { status: 404 });
    }

    await db.brandKit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete brand kit.";
    console.error("BrandKit DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
