import { NextRequest, NextResponse } from "next/server";

const API_CONFIGS: Record<string, {
  getUrl: (key: string) => string;
  getHeaders: (key: string) => Record<string, string>;
  buildBody: (prompt: string) => object;
  parseResponse: (data: any) => string;
}> = {
  gemini: {
    getUrl: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (prompt) => ({ contents: [{ parts: [{ text: prompt }] }] }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
  deepseek: {
    getUrl: () => "https://api.deepseek.com/chat/completions",
    getHeaders: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    buildBody: (prompt) => ({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }] }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },
  glm: {
    getUrl: () => "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    getHeaders: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    buildBody: (prompt) => ({ model: "glm-4", messages: [{ role: "user", content: prompt }] }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },
};

function getApiKey(provider: string): string | null {
  const envMap: Record<string, string> = {
    gemini: process.env.GEMINI_API_KEY || "",
    deepseek: process.env.DEEPSEEK_API_KEY || "",
    glm: process.env.GLM_API_KEY || "",
  };
  return envMap[provider] || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "gemini", productName, productDesc, tone, audience, platforms } = body;

    if (!productName || !productDesc) {
      return NextResponse.json({ error: "Product name and description are required." }, { status: 400 });
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json({ error: `No API key configured for ${provider}. Please set the environment variable.` }, { status: 500 });
    }

    const config = API_CONFIGS[provider];
    if (!config) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    const toneMap: Record<string, string> = {
      professional: "professional and authoritative",
      luxury: "luxurious and premium, evoking exclusivity",
      casual: "casual, warm, and conversational",
      urgent: "urgent and action-driven with strong CTAs",
      humorous: "witty, clever, and gently humorous",
      inspirational: "inspirational, emotional, and aspirational",
    };

    const platformLabel = platforms?.length > 0 ? platforms.join(", ") : "Instagram, Facebook";
    const audienceNote = audience ? `Target audience: ${audience}.` : "Identify the most suitable target audience.";

    const prompt = `You are a senior advertising strategist and copywriter at a top-tier creative agency. Generate a complete, professional advertisement campaign for the following product.

Product: ${productName}
Description: ${productDesc}
Tone: ${toneMap[tone] || "professional and authoritative"}
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
    let raw = config.parseResponse(data);
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong generating the campaign." },
      { status: 500 }
    );
  }
}
