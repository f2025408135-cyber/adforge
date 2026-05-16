/**
 * AdForge — Shared AI Provider Configuration
 *
 * SINGLE SOURCE OF TRUTH for all AI provider configs.
 * Both /api/generate and /api/regenerate import from here.
 */

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
  gemini: {
    getUrl: (key) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (prompt, temperature = 0.7) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
    parseResponse: (data: any) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    parseTokenUsage: (data: any) =>
      data.usageMetadata?.totalTokenCount || 0,
  },
  deepseek: {
    getUrl: () => "https://api.deepseek.com/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt, temperature = 0.7) => ({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
    parseTokenUsage: (data: any) =>
      (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  },
  glm: {
    getUrl: () => "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt, temperature = 0.7) => ({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
    parseResponse: (data: any) =>
      data.choices?.[0]?.message?.content || "",
    parseTokenUsage: (data: any) =>
      (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  },
};

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
 * Map creativity slider (0-100) to AI temperature
 */
export function mapCreativityToTemperature(creativity: number): number {
  if (creativity <= 33) return 0.3;
  if (creativity <= 66) return 0.7;
  return 1.0;
}
