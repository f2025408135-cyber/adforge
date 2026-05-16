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

    // ── Resolve template additions ────────────────────────────
    let templateAdditions: string | undefined;
    if (templateId) {
      // Check built-in templates first
      if (TEMPLATE_PROMPTS[templateId]) {
        templateAdditions = TEMPLATE_PROMPTS[templateId];
      } else {
        // Look up user-created template in database
        const template = await db.template.findUnique({ where: { id: templateId } });
        if (template) {
          templateAdditions = template.promptTemplate;
          // Increment usage count
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

    // ── Parse JSON from AI response ───────────────────────────
    const clean = raw.replace(/```json\s*|```/g, "").trim();
    let result: Record<string, string>;
    try {
      result = JSON.parse(clean);
    } catch {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response as JSON. Please try again." },
          { status: 500 }
        );
      }
    }

    // ── Record API usage ──────────────────────────────────────
    const userId = "demo-user"; // TODO: replace with session user id after auth
    await db.apiUsage.create({
      data: {
        userId,
        provider,
        endpoint: "generate",
        tokensUsed,
      },
    });

    return NextResponse.json({ result, provider, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong generating the campaign.";
    console.error("Generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
