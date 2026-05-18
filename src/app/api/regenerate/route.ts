/**
 * AdForge — /api/regenerate (Single Section Regeneration)
 *
 * POST endpoint that regenerates a single section of a campaign.
 * Uses SECTION_PROMPTS for focused prompts per section.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, mapCreativityToTemperature } from "@/lib/ai-providers";
import { SECTION_PROMPTS, TONE_MAP } from "@/lib/prompt-templates";
import { regenerateSchema } from "@/lib/validations";
import { db, isDbAvailable } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add the key to .env.local on the server.` },
        { status: 500 }
      );
    }

    const config = API_CONFIGS[provider];
    if (!config) {
      return NextResponse.json({ error: "Invalid provider selected." }, { status: 400 });
    }

    const temperature = mapCreativityToTemperature(creativity);

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

    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const reqBody = config.buildBody(prompt, temperature);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(90000), // 90s timeout (reasoning models need more time)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || errData.message || `AI provider returned ${response.status}`;
      return NextResponse.json(
        { error: errMsg },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json();
    const raw = config.parseResponse(data);
    const tokensUsed = config.parseTokenUsage(data);
    const text = raw.replace(/```json\s*|```/g, "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    if (isDbAvailable()) {
      try {
        const userId = "demo-user";
        await db.apiUsage.create({
          data: { userId, provider, endpoint: `regenerate-${sectionKey}`, tokensUsed },
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ text, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong regenerating the section.";
    console.error("Regenerate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
