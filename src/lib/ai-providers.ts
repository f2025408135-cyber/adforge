/**
 * ─────────────────────────────────────────────────────────────
 * ADFORGE — Shared AI Provider Configuration
 * ─────────────────────────────────────────────────────────────
 *
 * This module is the SINGLE SOURCE OF TRUTH for all AI provider
 * configs. Both /api/generate and /api/regenerate import from here.
 *
 * TO ADD A NEW PROVIDER:
 *   1. Add an entry to API_CONFIGS below
 *   2. Add the env variable name to getApiKey()
 *   3. Add the provider to the PROVIDERS array in page.tsx
 *
 * ENVIRONMENT VARIABLES (set in .env.local):
 *   GEMINI_API_KEY   — Google Gemini API key
 *   DEEPSEEK_API_KEY — DeepSeek API key
 *   GLM_API_KEY      — ZhipuAI GLM API key
 */

export const API_CONFIGS: Record<
  string,
  {
    getUrl: (key: string) => string;
    getHeaders: (key: string) => Record<string, string>;
    buildBody: (prompt: string) => object;
    parseResponse: (data: unknown) => string;
  }
> = {
  gemini: {
    getUrl: (key) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    parseResponse: (data: any) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
  deepseek: {
    getUrl: () => "https://api.deepseek.com/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt) => ({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
  },
  glm: {
    getUrl: () => "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt) => ({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
  },
};

/**
 * Retrieve the server-side API key for a given provider.
 * Keys are read from environment variables — NEVER sent to the client.
 * Returns null if the key is not configured.
 */
export function getApiKey(provider: string): string | null {
  const envMap: Record<string, string> = {
    gemini: process.env.GEMINI_API_KEY || "",
    deepseek: process.env.DEEPSEEK_API_KEY || "",
    glm: process.env.GLM_API_KEY || "",
  };
  const key = envMap[provider];
  return key && key.length > 0 ? key : null;
}

/**
 * ─────────────────────────────────────────────────────────────
 * Shared Tone Map — used by both generate and regenerate routes
 * ─────────────────────────────────────────────────────────────
 *
 * If you add a new tone, add it here AND in page.tsx's TONES array.
 */
export const TONE_MAP: Record<string, string> = {
  professional: "professional and authoritative",
  luxury: "luxurious and premium, evoking exclusivity",
  casual: "casual, warm, and conversational",
  urgent: "urgent and action-driven with strong CTAs",
  humorous: "witty, clever, and gently humorous",
  inspirational: "inspirational, emotional, and aspirational",
};

/**
 * Section-specific prompt templates for regenerating individual cards.
 * Each function returns a focused prompt for just that section.
 */
export const SECTION_PROMPTS: Record<
  string,
  (name: string, desc: string, tone: string, platforms: string) => string
> = {
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
