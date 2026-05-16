/**
 * AdForge — /api/enhance-description
 *
 * POST endpoint that uses AI to enhance and enrich a product description,
 * making it more compelling, specific, and benefit-driven for advertising.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey } from "@/lib/ai-providers";
import { enhanceDescSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Validate input ────────────────────────────────────────
    const parsed = enhanceDescSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { provider, productName, productDesc } = parsed.data;

    // ── Resolve API key ───────────────────────────────────────
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please set the environment variable in .env.local.` },
        { status: 500 }
      );
    }

    const config = API_CONFIGS[provider];
    if (!config) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    // ── Build prompt ──────────────────────────────────────────
    const prompt = `Improve and enrich this product description for advertising purposes. Make it more compelling, specific, and benefit-driven. Keep it concise (2-3 sentences). Product: ${productName}. Original description: ${productDesc}. Return ONLY the improved description.`;

    // ── Call AI provider ──────────────────────────────────────
    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const reqBody = config.buildBody(prompt, 0.7);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || `AI provider returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const raw = config.parseResponse(data);
    const tokensUsed = config.parseTokenUsage(data);
    const enhancedDesc = raw.replace(/```json\s*|```/g, "").trim();

    // ── Record API usage ──────────────────────────────────────
    const userId = "demo-user"; // TODO: replace with session user id after auth
    await db.apiUsage.create({
      data: {
        userId,
        provider,
        endpoint: "enhance-description",
        tokensUsed,
      },
    });

    return NextResponse.json({ enhancedDesc, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong enhancing the description.";
    console.error("Enhance description error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
