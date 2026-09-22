/**
 * AdForge CLI — AI Provider Module
 *
 * Handles all AI API calls (DeepSeek, Gemini, GLM).
 * Reuses the same prompt engineering from the web app.
 */

// ── Prompt Engineering ───────────────────────────────────────────

const TONE_MAP = {
  professional: "professional and authoritative",
  luxury: "luxurious and premium, evoking exclusivity",
  casual: "casual, warm, and conversational",
  urgent: "urgent and action-driven with strong CTAs",
  humorous: "witty, clever, and gently humorous",
  inspirational: "inspirational, emotional, and aspirational",
  playful: "playful, fun, and energetic",
  minimalist: "minimalist, clean, and stripped-down",
  bold: "bold, provocative, and attention-grabbing",
  empathetic: "empathetic, caring, and understanding",
  technical: "technical, precise, and data-driven",
  storytelling: "narrative-driven, story-based, and immersive",
};

const LANGUAGE_MAP = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  zh: "Chinese", ja: "Japanese", ar: "Arabic", pt: "Portuguese", hi: "Hindi",
};

function buildGenerationPrompt({ productName, productDesc, tone, platforms, audience, brandVoice, language, additionalInstructions }) {
  const toneDesc = TONE_MAP[tone] || TONE_MAP.professional;
  const platformStr = platforms.join(", ") || "Instagram, Facebook";
  const audienceStr = audience
    ? `Target audience: ${audience}.`
    : "Identify the most suitable target audience.";
  const langStr = language && language !== "en"
    ? `Generate ALL content in ${LANGUAGE_MAP[language] || language}.`
    : "";
  const brandStr = brandVoice
    ? `BRAND VOICE: ${brandVoice}`
    : "";
  const addStr = additionalInstructions
    ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}`
    : "";

  return `You are a senior advertising strategist and master copywriter at a top-tier creative agency with 20+ years of experience crafting campaigns for Fortune 500 brands. Generate a complete, professional advertisement campaign.

PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${toneDesc}
PLATFORMS: ${platformStr}
${audienceStr}
${langStr}
${brandStr}
${addStr}

Return a JSON object with EXACTLY these keys:
- "headline": A powerful, attention-grabbing headline (8-15 words)
- "tagline": A memorable tagline (3-8 words)
- "adCopy": Compelling ad copy body (80-200 words)
- "callToAction": A strong call-to-action phrase
- "targetAudience": Refined target audience description
- "keyBenefits": 3-5 key benefits, pipe-separated in one string
- "platformVersions": A JSON string containing platform-specific versions

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no code fences, no extra text
2. Make content specific to the product, not generic
3. Each platform version must be tailored to that platform's style
4. The tone must be unmistakably ${toneDesc}`;
}

function buildRegenerationPrompt({ sectionKey, productName, productDesc, tone, platforms, currentContent, language }) {
  const toneDesc = TONE_MAP[tone] || TONE_MAP.professional;
  const sectionNames = {
    headline: "headline (8-15 words, attention-grabbing)",
    tagline: "tagline (3-8 words, memorable)",
    adCopy: "ad copy body (80-200 words, compelling)",
    callToAction: "call-to-action phrase (strong, action-driven)",
    targetAudience: "target audience description (specific, refined)",
    keyBenefits: "key benefits (3-5 benefits, pipe-separated)",
    platformVersions: "platform-specific versions (JSON string with platform keys)",
  };

  return `You are a senior advertising strategist and master copywriter. Regenerate ONLY the ${sectionNames[sectionKey] || sectionKey} for this campaign.

PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${toneDesc}
PLATFORMS: ${platforms.join(", ")}
${currentContent ? `CURRENT ${sectionKey}: ${currentContent}` : ""}
${language && language !== "en" ? `Generate in ${LANGUAGE_MAP[language] || language}.` : ""}

Return a JSON object with exactly one key: "${sectionKey}"
The value should be the regenerated content.

CRITICAL: Return ONLY valid JSON — no markdown, no code fences.`;
}

function buildEnhancePrompt({ productName, productDesc }) {
  return `You are a marketing copy expert. Enhance this product description to be more compelling, specific, and professional for advertising purposes.

PRODUCT NAME: ${productName}
CURRENT DESCRIPTION: ${productDesc}

Return ONLY the enhanced description text — no JSON, no quotes, no extra formatting. Make it 2-3 sentences that would make someone want to learn more.`;
}

// ── API Provider Configs ─────────────────────────────────────────

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek V4 Flash",
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
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
    parseTokens: (data) => ({
      prompt: data.usage?.prompt_tokens || 0,
      completion: data.usage?.completion_tokens || 0,
      total: data.usage?.total_tokens || 0,
    }),
    pricing: { input: 0.10, output: 0.40 }, // per million tokens
  },
  gemini: {
    name: "Gemini 2.5 Flash",
    getUrl: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (prompt, temperature = 0.7) => ({
      system_instruction: {
        parts: [{ text: "You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand." }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: "application/json" },
    }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    parseTokens: (data) => ({
      prompt: data.usageMetadata?.promptTokenCount || 0,
      completion: data.usageMetadata?.candidatesTokenCount || 0,
      total: data.usageMetadata?.totalTokenCount || 0,
    }),
    pricing: { input: 0.075, output: 0.30 },
  },
  glm: {
    name: "GLM 4 Flash",
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
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
    parseTokens: (data) => ({
      prompt: data.usage?.prompt_tokens || 0,
      completion: data.usage?.completion_tokens || 0,
      total: (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
    }),
    pricing: { input: 0.10, output: 0.10 },
  },
};

// ── AI Call Function ─────────────────────────────────────────────

async function callAI(provider, prompt, { temperature = 0.7, apiKey } = {}) {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  if (!apiKey) {
    const envMap = { deepseek: "DEEPSEEK_API_KEY", gemini: "GEMINI_API_KEY", glm: "GLM_API_KEY" };
    apiKey = process.env[envMap[provider]];
    if (!apiKey) throw new Error(`No API key for ${config.name}. Set ${envMap[provider]} env var.`);
  }

  const url = config.getUrl(apiKey);
  const headers = config.getHeaders(apiKey);
  const body = config.buildBody(prompt, temperature);

  const startTime = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  const data = await response.json();
  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    const errMsg = data.error?.message || data.message || `API error ${response.status}`;
    throw new Error(`${config.name} API error: ${errMsg}`);
  }

  const raw = config.parseResponse(data);
  const tokens = config.parseTokens(data);
  const cost = (tokens.prompt * config.pricing.input / 1000000) + (tokens.completion * config.pricing.output / 1000000);

  return { raw, tokens, cost, elapsed, provider: config.name };
}

// ── Parse JSON from AI Response ──────────────────────────────────

function parseAIJson(raw) {
  const clean = raw.replace(/```json\s*|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

// ── Exported Functions ───────────────────────────────────────────

export async function generateCampaign(input) {
  const prompt = buildGenerationPrompt(input);
  const creativity = input.creativity || 50;
  const temperature = creativity <= 33 ? 0.3 : creativity <= 66 ? 0.7 : 1.0;

  const result = await callAI(input.provider || "deepseek", prompt, { temperature });
  const parsed = parseAIJson(result.raw);

  if (!parsed) {
    throw new Error("AI returned invalid JSON. Try again.");
  }

  // Ensure all required keys exist
  const requiredKeys = ["headline", "tagline", "adCopy", "callToAction", "targetAudience", "keyBenefits", "platformVersions"];
  for (const key of requiredKeys) {
    if (!parsed[key]) parsed[key] = `[Missing: regenerate ${key}]`;
  }

  return { campaign: parsed, meta: result };
}

export async function regenerateSection(input) {
  const prompt = buildRegenerationPrompt(input);
  const creativity = input.creativity || 50;
  const temperature = creativity <= 33 ? 0.3 : creativity <= 66 ? 0.7 : 1.0;

  const result = await callAI(input.provider || "deepseek", prompt, { temperature });
  const parsed = parseAIJson(result.raw);

  if (!parsed) {
    throw new Error("AI returned invalid JSON for section regeneration. Try again.");
  }

  return { section: parsed, meta: result };
}

export async function enhanceDescription(input) {
  const prompt = buildEnhancePrompt(input);
  const result = await callAI(input.provider || "deepseek", prompt, { temperature: 0.7 });

  return { enhanced: result.raw.trim(), meta: result };
}

export function getAvailableProviders() {
  return [
    { id: "deepseek", name: "DeepSeek V4 Flash", hasKey: !!process.env.DEEPSEEK_API_KEY },
    { id: "gemini", name: "Gemini 2.0 Flash", hasKey: !!process.env.GEMINI_API_KEY },
    { id: "glm", name: "GLM 4 Flash", hasKey: !!process.env.GLM_API_KEY },
  ].filter(p => p.hasKey);
}

export { TONE_MAP, PROVIDERS };
