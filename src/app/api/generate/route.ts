/**
 * ─────────────────────────────────────────────────────────────
 * ADFORGE — /api/generate (Full Campaign Generation)
 * ─────────────────────────────────────────────────────────────
 *
 * POST endpoint that generates a complete ad campaign.
 * API keys are read from environment variables on the server.
 *
 * REQUEST BODY:
 *   provider    — "gemini" | "deepseek" | "glm"
 *   productName — string (required)
 *   productDesc — string (required)
 *   tone        — string (default: "professional")
 *   audience    — string (optional)
 *   platforms   — string[] (default: ["instagram", "facebook"])
 *
 * RESPONSE:
 *   Success: { result: CampaignResult }
 *   Error:   { error: string }
 *
 * CampaignResult keys: headline, tagline, adCopy, callToAction,
 *                      targetAudience, platformVersions, keyBenefits
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, TONE_MAP } from "@/lib/ai-providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "gemini",
      productName,
      productDesc,
      tone,
      audience,
      platforms,
    } = body;

    if (!productName || !productDesc) {
      return NextResponse.json(
        { error: "Product name and description are required." },
        { status: 400 }
      );
    }

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

    const toneStr = TONE_MAP[tone] || TONE_MAP.professional;
    const platformLabel =
      platforms?.length > 0 ? platforms.join(", ") : "Instagram, Facebook";
    const audienceNote = audience
      ? `Target audience: ${audience}.`
      : "Identify the most suitable target audience.";

    const prompt = `You are a senior advertising strategist and copywriter at a top-tier creative agency. Generate a complete, professional advertisement campaign for the following product.

Product: ${productName}
Description: ${productDesc}
Tone: ${toneStr}
Platforms: ${platformLabel}
${audienceNote}

Return ONLY a valid JSON object with exactly these keys (no extra text, no markdown):
{
  "headline": "A powerful, memorable main headline (max 12 words)",
  "tagline": "A concise brand tagline or slogan (max 8 words)",
  "adCopy": "Full advertisement body copy, 3-4 sentences, persuasive and on-brand",
  "callToAction": "A strong, specific CTA phrase (max 6 words)",
  "targetAudience": "Detailed target audience profile, 2-3 sentences covering demographics, psychographics, and behavior",
  "platformVersions": "Brief adapted copy notes for each requested platform (1-2 sentences each)",
  "keyBenefits": "3 key product benefits as a short list, each on a new line starting with •"
}`;

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
    const raw = config.parseResponse(data);
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong generating the campaign.";
    console.error("Generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
