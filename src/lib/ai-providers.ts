/**
 * AdForge — Shared AI Provider Configuration
 *
 * SINGLE SOURCE OF TRUTH for all AI provider configs.
 * Both /api/generate and /api/regenerate import from here.
 *
 * Models updated to current supported versions:
 * - AdForge AI (z-ai-sdk): Always available, no key needed — built-in!
 * - DeepSeek: deepseek-v4-flash (reasoning model, fast + creative)
 * - Gemini: gemini-2.5-flash (free tier, 10 RPM, $0.30/M output)
 * - GLM: glm-4-flash (latest available)
 */

import ZAI from "z-ai-web-dev-sdk";

// Lazy-initialize the Z-AI SDK instance
let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export const API_CONFIGS: Record<
  string,
  {
    getUrl: (key: string) => string;
    getHeaders: (key: string) => Record<string, string>;
    buildBody: (prompt: string, temperature?: number) => object;
    parseResponse: (data: unknown) => string;
    parseTokenUsage: (data: unknown) => number;
  }
> = {
  deepseek: {
    getUrl: () => "https://api.deepseek.com/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt, temperature = 0.7) => ({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: "You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand." },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: 8192,
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
    parseTokenUsage: (data: any) =>
      (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  },
  // Gemini 2.5 Flash — free tier, fast, great for ad copy
  gemini: {
    getUrl: (key) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (prompt, temperature = 0.7) => ({
      system_instruction: {
        parts: [{ text: "You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand." }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: "application/json" },
    }),
    parseResponse: (data: any) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    parseTokenUsage: (data: any) =>
      data.usageMetadata?.totalTokenCount || 0,
  },
  glm: {
    getUrl: () => "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt, temperature = 0.7) => ({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: "You are a senior advertising strategist and master copywriter. Always respond with valid JSON when asked. Be creative, specific, and on-brand." },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: 4096,
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
    parseTokenUsage: (data: any) =>
      (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  },
};

/**
 * Check if a provider requires an API key.
 * "adforge" uses the built-in z-ai SDK and needs no key.
 */
export function providerRequiresKey(provider: string): boolean {
  return provider !== "adforge";
}

export function getApiKey(provider: string): string | null {
  const envMap: Record<string, string> = {
    deepseek: process.env.DEEPSEEK_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    glm: process.env.GLM_API_KEY || "",
  };
  const key = envMap[provider];
  return key && key.length > 0 ? key : null;
}

/**
 * Call the built-in AdForge AI provider (z-ai-sdk).
 * Always available — no API key required.
 */
export async function callAdforgeAI(prompt: string, temperature = 0.7): Promise<{ raw: string; tokensUsed: number }> {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand.",
      },
      { role: "user", content: prompt },
    ],
    temperature,
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  const tokensUsed = completion.usage?.total_tokens || 0;
  return { raw, tokensUsed };
}

/**
 * Get list of providers that have API keys configured, PLUS the always-available AdForge AI.
 * Used by the frontend to show which providers are available.
 */
export function getAvailableProviders(): { id: string; label: string; available: boolean; model: string }[] {
  return [
    { id: "adforge", label: "AdForge AI", available: true, model: "Built-in" },
    { id: "deepseek", label: "DeepSeek", available: !!(process.env.DEEPSEEK_API_KEY), model: "V4 Flash" },
    { id: "gemini", label: "Gemini", available: !!(process.env.GEMINI_API_KEY), model: "2.5 Flash" },
    { id: "glm", label: "GLM", available: !!(process.env.GLM_API_KEY), model: "4 Flash" },
  ];
}

/**
 * Map creativity slider (0-100) to AI temperature
 */
export function mapCreativityToTemperature(creativity: number): number {
  if (creativity <= 33) return 0.3;
  if (creativity <= 66) return 0.7;
  return 1.0;
}
