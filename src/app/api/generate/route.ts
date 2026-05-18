/**
 * AdForge — /api/generate (Full Campaign Generation)
 *
 * POST endpoint that generates a complete ad campaign using the selected
 * AI provider. Validates input with Zod, builds the prompt via
 * buildGenerationPrompt, calls the AI, parses the JSON result and
 * records token usage.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, mapCreativityToTemperature } from "@/lib/ai-providers";
import { buildGenerationPrompt, TEMPLATE_PROMPTS } from "@/lib/prompt-templates";
import { generateSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Validate input ────────────────────────────────────────
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      provider,
      productName,
      productDesc,
      tone,
      audience,
      platforms,
      brandVoice,
      language,
      creativity,
      templateId,
      additionalInstructions,
    } = parsed.data;

    // ── Resolve API key ───────────────────────────────────────
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

    // ── Map creativity to temperature ─────────────────────────
    const temperature = mapCreativityToTemperature(creativity);

    // ── Resolve template additions ────────────────────────────
    let templateAdditions: string | undefined;
    if (templateId) {
      if (TEMPLATE_PROMPTS[templateId]) {
        templateAdditions = TEMPLATE_PROMPTS[templateId];
      } else {
        const template = await db.template.findUnique({ where: { id: templateId } });
        if (template) {
          templateAdditions = template.promptTemplate;
          await db.template.update({
            where: { id: templateId },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    // ── Build prompt ──────────────────────────────────────────
    const prompt = buildGenerationPrompt({
      productName,
      productDesc,
      tone,
      platforms,
      audience,
      brandVoice,
      language,
      templateAdditions,
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
      signal: AbortSignal.timeout(120000), // 120s timeout (reasoning models need more time)
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

    if (!raw || raw.trim().length === 0) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // ── Parse JSON from AI response ───────────────────────────
    const clean = raw.replace(/```json\s*|```/g, "").trim();
    let result: Record<string, string>;
    try {
      result = JSON.parse(clean);
    } catch {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            { error: "Failed to parse AI response. The AI returned malformed JSON. Please try again." },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "AI did not return valid JSON. Please try again with a different provider or slightly modified input." },
          { status: 502 }
        );
      }
    }

    // ── Validate result has all required keys ─────────────────
    const requiredKeys = ["headline", "tagline", "adCopy", "callToAction", "targetAudience", "keyBenefits", "platformVersions"];
    for (const key of requiredKeys) {
      if (!result[key] || typeof result[key] !== "string") {
        result[key] = result[key] || `Please regenerate — ${key} was missing from AI response.`;
      }
    }

    // ── Record API usage ──────────────────────────────────────
    try {
      const userId = "demo-user";
      await db.apiUsage.create({
        data: { userId, provider, endpoint: "generate", tokensUsed },
      });
    } catch {
      // Non-critical: don't fail the request if usage tracking fails
    }

    return NextResponse.json({ result, provider, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong generating the campaign.";
    console.error("Generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
