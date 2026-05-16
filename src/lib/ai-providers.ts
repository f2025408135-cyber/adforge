export type Provider = 'gemini' | 'deepseek' | 'glm';

export interface AIProviderConfig {
  name: string;
  description: string;
  model: string;
  getUrl: (apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (prompt: string, temperature?: number) => Record<string, unknown>;
  parseResponse: (data: unknown) => string;
}

export const API_CONFIGS: Record<Provider, AIProviderConfig> = {
  gemini: {
    name: 'Gemini',
    description: 'Fast and creative — ideal for social media and short-form copy',
    model: 'gemini-1.5-flash',
    getUrl: (key: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
    buildBody: (prompt: string, temperature = 0.7) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
    }),
    parseResponse: (data: unknown) => {
      const d = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Thoughtful and detailed — best for long-form and analytical copy',
    model: 'deepseek-chat',
    getUrl: () => 'https://api.deepseek.com/chat/completions',
    getHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt: string, temperature = 0.7) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2048,
    }),
    parseResponse: (data: unknown) => {
      const d = data as { choices?: Array<{ message?: { content?: string } }> };
      return d.choices?.[0]?.message?.content || '';
    },
  },
  glm: {
    name: 'GLM',
    description: 'Versatile and precise — great for multilingual and structured output',
    model: 'glm-4',
    getUrl: () => 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    getHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    }),
    buildBody: (prompt: string, temperature = 0.7) => ({
      model: 'glm-4',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2048,
    }),
    parseResponse: (data: unknown) => {
      const d = data as { choices?: Array<{ message?: { content?: string } }> };
      return d.choices?.[0]?.message?.content || '';
    },
  },
};

export function getApiKey(provider: Provider): string | null {
  switch (provider) {
    case 'gemini':
      return process.env.GEMINI_API_KEY || null;
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY || null;
    case 'glm':
      return process.env.GLM_API_KEY || null;
  }
}

export function creativityToTemperature(creativity: number): number {
  if (creativity <= 33) return 0.3;
  if (creativity <= 66) return 0.7;
  return 1.0;
}

export const TONE_MAP: Record<string, string> = {
  professional: 'professional and authoritative',
  luxury: 'luxurious and premium, evoking exclusivity',
  casual: 'casual, warm, and conversational',
  urgent: 'urgent and action-driven with strong CTAs',
  humorous: 'witty, clever, and gently humorous',
  inspirational: 'inspirational, emotional, and aspirational',
  playful: 'playful, fun, and enthusiastic',
  minimalist: 'minimalist, clean, and focused',
  bold: 'bold, confident, and daring',
  empathetic: 'empathetic, understanding, and caring',
  technical: 'technical, precise, and data-driven',
  storytelling: 'narrative-driven, engaging, and memorable',
};

export const TONE_PREVIEWS: Record<string, string> = {
  professional: '"Trust the expertise that drives industry-leading results."',
  luxury: '"Because you deserve nothing less than extraordinary."',
  casual: '"Hey there, we thought you might love this!"',
  urgent: '"Limited time only — act now before it\'s gone!"',
  humorous: '"Finally, something that actually works. No, seriously."',
  inspirational: '"Dream bigger. Start today. Transform tomorrow."',
  playful: '"Let\'s make something awesome together!"',
  minimalist: '"Less is more. Here\'s what matters."',
  bold: '"We don\'t do things halfway. Neither should you."',
  empathetic: '"We understand what you\'re going through."',
  technical: '"Precision engineering meets creative excellence."',
  storytelling: '"Every great journey begins with a single step."',
};

export const SECTION_PROMPTS: Record<string, (name: string, desc: string, toneStr: string, platforms?: string) => string> = {
  headline: (name, desc, toneStr) =>
    `Generate ONE powerful, memorable advertisement headline for the product "${name}" (${desc}). Tone: ${toneStr}. Max 12 words. Return ONLY the headline text, nothing else.`,
  tagline: (name, desc, toneStr) =>
    `Generate ONE concise brand tagline/slogan for the product "${name}" (${desc}). Tone: ${toneStr}. Max 8 words. Return ONLY the tagline text, nothing else.`,
  adCopy: (name, desc, toneStr) =>
    `Write advertisement body copy for the product "${name}" (${desc}). Tone: ${toneStr}. 3-4 sentences, persuasive and on-brand, 50-100 words. Return ONLY the ad copy text, nothing else.`,
  callToAction: (name, desc, toneStr) =>
    `Generate ONE strong, specific call-to-action phrase for the product "${name}" (${desc}). Tone: ${toneStr}. Max 6 words. Return ONLY the CTA text, nothing else.`,
  targetAudience: (name, desc, toneStr) =>
    `Write a detailed target audience profile for the product "${name}" (${desc}). Tone: ${toneStr}. 2-3 sentences covering demographics, psychographics, and behavior. Return ONLY the audience profile text, nothing else.`,
  keyBenefits: (name, desc, toneStr) =>
    `List 3 key product benefits for "${name}" (${desc}). Tone: ${toneStr}. Each benefit on a new line starting with •. Return ONLY the benefits list, nothing else.`,
  platformVersions: (name, desc, toneStr, platforms) =>
    `Write brief adapted copy notes for each platform (${platforms}) for the product "${name}" (${desc}). Tone: ${toneStr}. 1-2 sentences per platform. Return ONLY the platform adaptations, nothing else.`,
};

export const PLATFORM_INFO: Record<string, { icon: string; idealLength: string }> = {
  instagram: { icon: '📸', idealLength: '2200 chars' },
  facebook: { icon: '👥', idealLength: '125 chars' },
  twitter: { icon: '🐦', idealLength: '280 chars' },
  linkedin: { icon: '💼', idealLength: '3000 chars' },
  tiktok: { icon: '🎵', idealLength: '2200 chars' },
  youtube: { icon: '▶️', idealLength: '5000 chars' },
  billboard: { icon: '🏙️', idealLength: '7 words' },
  email: { icon: '📧', idealLength: '500 words' },
  googleads: { icon: '🔍', idealLength: '90 chars' },
  pinterest: { icon: '📌', idealLength: '500 chars' },
  snapchat: { icon: '👻', idealLength: '80 chars' },
};