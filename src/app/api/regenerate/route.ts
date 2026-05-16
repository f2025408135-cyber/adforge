/**
 * ─────────────────────────────────────────────────────────────
 * ADFORGE — /api/regenerate (Individual Section Regeneration)
 * ─────────────────────────────────────────────────────────────
 *
 * POST endpoint that regenerates a single section of a campaign.
 * Used by the "refresh" button on each output card.
 *
 * REQUEST BODY:
 *   provider    — "gemini" | "deepseek" | "glm"
 *   sectionKey  — "headline" | "tagline" | "adCopy" | "callToAction"
 *                 | "targetAudience" | "keyBenefits" | "platformVersions"
 *   productName — string (required)
 *   productDesc — string (required)
 *   tone        — string
 *   platforms   — string[]
 *
 * RESPONSE:
 *   Success: { text: string }
 *   Error:   { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, TONE_MAP, SECTION_PROMPTS } from "@/lib/ai-providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "gemini",
      sectionKey,
      productName,
      productDesc,
      tone,
      platforms,
    } = body;

    if (!sectionKey || !productName || !productDesc) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}.` },
        { status: 500 }
      );
    }

    const config = API_CONFIGS[provider];
    if (!config) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    const toneStr = TONE_MAP[tone] || TONE_MAP.professional;
    const promptFn = SECTION_PROMPTS[sectionKey];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid section key." }, { status: 400 });
    }

    const prompt = promptFn(
      productName,
      productDesc,
      toneStr,
      platforms?.join(", ") || "Instagram, Facebook"
    );

    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const reqBody = config.buildBody(prompt);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || `API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let text = config.parseResponse(data);
    text = text.replace(/```json|```/g, "").trim();

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong regenerating the section.";
    console.error("Regenerate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
