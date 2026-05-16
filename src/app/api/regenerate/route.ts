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

const SECTION_PROMPTS: Record<string, (name: string, desc: string, tone: string, platforms: string) => string> = {
  headline: (name, desc, tone) =>
    `Generate ONE powerful, memorable advertisement headline for the product "${name}" (${desc}). Tone: ${tone}. Max 12 words. Return ONLY the headline text, nothing else.`,
  tagline: (name, desc, tone) =>
    `Generate ONE concise brand tagline/slogan for the product "${name}" (${desc}). Tone: ${tone}. Max 8 words. Return ONLY the tagline text, nothing else.`,
  adCopy: (name, desc, tone) =>
    `Write advertisement body copy for the product "${name}" (${desc}). Tone: ${tone}. 3-4 sentences, persuasive and on-brand, 50-100 words. Return ONLY the ad copy text, nothing else.`,
  callToAction: (name, desc, tone) =>
    `Generate ONE strong, specific call-to-action phrase for the product "${name}" (${desc}). Tone: ${tone}. Max 6 words. Return ONLY the CTA text, nothing else.`,
  targetAudience: (name, desc, tone) =>
    `Write a detailed target audience profile for the product "${name}" (${desc}). Tone: ${tone}. 2-3 sentences covering demographics, psychographics, and behavior. Return ONLY the audience profile text, nothing else.`,
  keyBenefits: (name, desc, tone) =>
    `List 3 key product benefits for "${name}" (${desc}). Tone: ${tone}. Each benefit on a new line starting with •. Return ONLY the benefits list, nothing else.`,
  platformVersions: (name, desc, tone, platforms) =>
    `Write brief adapted copy notes for each platform (${platforms}) for the product "${name}" (${desc}). Tone: ${tone}. 1-2 sentences per platform. Return ONLY the platform adaptations, nothing else.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "gemini", sectionKey, productName, productDesc, tone, platforms } = body;

    if (!sectionKey || !productName || !productDesc) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json({ error: `No API key configured for ${provider}.` }, { status: 500 });
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

    const toneStr = toneMap[tone] || "professional and authoritative";
    const promptFn = SECTION_PROMPTS[sectionKey];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid section key." }, { status: 400 });
    }

    const prompt = promptFn(productName, productDesc, toneStr, platforms?.join(", ") || "Instagram, Facebook");

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
  } catch (err: any) {
    console.error("Regenerate error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong regenerating the section." },
      { status: 500 }
    );
  }
}
