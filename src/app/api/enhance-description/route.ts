/**
 * AdForge — /api/enhance-description
 *
 * POST endpoint that uses AI to enhance and enrich a product description,
 * making it more compelling, specific, and benefit-driven for advertising.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIGS, getApiKey, callAdforgeAI } from "@/lib/ai-providers";
import { enhanceDescSchema } from "@/lib/validations";
import { db, isDbAvailable } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = enhanceDescSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { provider, productName, productDesc } = parsed.data;

    // ── Resolve API key (client key takes priority over server env) ──
    const clientApiKey = body.apiKey as string | undefined;
    const apiKey = provider === "adforge" ? "built-in" : (clientApiKey || getApiKey(provider));

    const prompt = `Improve and enrich this product description for advertising purposes. Make it more compelling, specific, and benefit-driven. Keep it concise (2-3 sentences). Product: ${productName}. Original description: ${productDesc}. Return ONLY the improved description text, nothing else. No JSON, no code blocks, just the plain text.`;

    let raw: string;
    let tokensUsed: number;

    if (provider === "adforge") {
      const aiResult = await callAdforgeAI(prompt, 0.7);
      raw = aiResult.raw;
      tokensUsed = aiResult.tokensUsed;
    } else {
      if (!apiKey) {
        return NextResponse.json(
          { error: `No API key for ${provider}. Enter your key in the API Key field, or set it in server environment.` },
          { status: 500 }
        );
      }
      const config = API_CONFIGS[provider];
      if (!config) {
        return NextResponse.json({ error: "Invalid provider selected." }, { status: 400 });
      }

      const url = config.getUrl(apiKey);
      const headers = config.getHeaders(apiKey);
      const reqBody = config.buildBody(prompt, 0.7);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(90000),
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
      raw = config.parseResponse(data);
      tokensUsed = config.parseTokenUsage(data);
    }

    let enhancedDesc = raw.replace(/```json\s*|```/g, "").trim();
    
    // If the response looks like JSON with a text field, extract it
    try {
      const parsed = JSON.parse(enhancedDesc);
      if (typeof parsed === "string") {
        enhancedDesc = parsed;
      } else if (parsed.description || parsed.text || parsed.enhanced || parsed.content) {
        enhancedDesc = parsed.description || parsed.text || parsed.enhanced || parsed.content;
      }
    } catch {
      // Not JSON, use as-is
    }

    if (!enhancedDesc) {
      return NextResponse.json(
        { error: "AI returned an empty enhancement. Please try again." },
        { status: 502 }
      );
    }

    if (isDbAvailable()) {
      try {
        const userId = "demo-user";
        await db.apiUsage.create({
          data: { userId, provider, endpoint: "enhance-description", tokensUsed },
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ enhancedDesc, tokensUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong enhancing the description.";
    console.error("Enhance description error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
