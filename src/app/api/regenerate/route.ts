/**
 * AdForge — /api/regenerate (Single Section Regeneration)
 *
 * POST endpoint that regenerates a single section of a campaign.
 * Uses SECTION_PROMPTS for focused prompts per section.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, mapCreativityToTemperature } from "@/lib/ai-providers";
import { SECTION_PROMPTS, TONE_MAP, LANGUAGE_MAP } from "@/lib/prompt-templates";
import { regenerateSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Validate input ────────────────────────────────────────
    const parsed = regenerateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      provider,
      sectionKey,
      productName,
      productDesc,
      tone,
      platforms,
      language,
      creativity,
      brandVoice,
      additionalInstructions,
    } = parsed.data;

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

    // ── Map creativity to temperature ─────────────────────────
    const temperature = mapCreativityToTemperature(creativity);

    // ── Build section-specific prompt ─────────────────────────
    const promptFn = SECTION_PROMPTS[sectionKey];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid section key." }, { status: 400 });
    }

    const toneDesc = TONE_MAP[tone] || TONE_MAP.professional;
    const prompt = promptFn({
      name: productName,
      desc: productDesc,
      tone: toneDesc,
      platforms: platforms.join(", ") || "Instagram, Facebook",
      language,
      brandVoice,
      additionalInstructions,
    });

    // ── Call AI provider ──────────────────────────────────────
    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const reqBody = config.buildBody(prompt, temperature);

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
    const text = raw.replace(/```json\s*|```/g, "").trim();

    // ── Record API usage ──────────────────────────────────────
    const userId = "demo-user"; // TODO: replace with session user id after auth
    await db.apiUsage.create({
      data: {
        userId,
        provider,
        endpoint: `regenerate-${sectionKey}`,
        tokensUsed,
      },
    });

    return NextResponse.json({ text, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong regenerating the section.";
    console.error("Regenerate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
