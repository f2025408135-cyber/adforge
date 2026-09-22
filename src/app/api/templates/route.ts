/**
 * AdForge — /api/templates (List + Create)
 *
 * GET  — List all public templates
 * POST — Create a new template
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";
import { templateSchema } from "@/lib/validations";

// ─── GET /api/templates ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json({ templates: [] });
    }
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const tone = searchParams.get("tone") || "";

    const templates = await db.template.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
        ...(tone && { tone }),
      },
      orderBy: { usageCount: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch templates.";
    console.error("Templates GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/templates ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!isDbAvailable()) {
      return NextResponse.json(
        { error: "Database unavailable in serverless mode. Features requiring persistence are disabled." },
        { status: 503 }
      );
    }
    const body = await req.json();

    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parsed.data;

    const template = await db.template.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        promptTemplate: data.promptTemplate,
        tone: data.tone,
        isPublic: data.isPublic,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create template.";
    console.error("Templates POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
