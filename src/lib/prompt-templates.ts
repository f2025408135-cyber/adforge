/**
 * AdForge — Prompt Templates for AI Generation
 *
 * All prompt engineering logic lives here. Both /api/generate and
 * /api/regenerate import from this module.
 */

export const TONE_MAP: Record<string, string> = {
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

export const TONE_PREVIEWS: Record<string, string> = {
  professional: "Trust the expertise that drives industry-leading results.",
  luxury: "Because you deserve nothing less than extraordinary.",
  casual: "Hey there, we thought you might love this!",
  urgent: "Limited time only — act now before it's gone!",
  humorous: "Finally, something that actually works. No, seriously.",
  inspirational: "Dream bigger. Start today. Transform tomorrow.",
  playful: "Life's too short for boring products. Let's play!",
  minimalist: "Less, but better.",
  bold: "Stop scrolling. This changes everything.",
  empathetic: "We understand what you're going through. We're here for you.",
  technical: "Engineered for performance. Backed by data.",
  storytelling: "It started with a simple idea that changed everything...",
};

export const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ar: "Arabic",
  pt: "Portuguese",
  hi: "Hindi",
};

/**
 * Build the main campaign generation prompt.
 */
export function buildGenerationPrompt(opts: {
  productName: string;
  productDesc: string;
  tone: string;
  platforms: string[];
  audience?: string;
  brandVoice?: string;
  language?: string;
  templateAdditions?: string;
  additionalInstructions?: string;
}): string {
  const toneDesc = TONE_MAP[opts.tone] || TONE_MAP.professional;
  const platformStr = opts.platforms.join(", ") || "Instagram, Facebook";
  const audienceStr = opts.audience
    ? `Target audience: ${opts.audience}.`
    : "Identify the most suitable target audience.";
  const langStr = opts.language && opts.language !== "en"
    ? `Generate ALL content in ${LANGUAGE_MAP[opts.language] || opts.language}.`
    : "";
  const brandStr = opts.brandVoice
    ? `BRAND VOICE: ${opts.brandVoice}`
    : "";
  const addStr = opts.additionalInstructions
    ? `ADDITIONAL INSTRUCTIONS: ${opts.additionalInstructions}`
    : "";
  const templateStr = opts.templateAdditions || "";

  return `You are a senior advertising strategist and master copywriter at a top-tier creative agency with 20+ years of experience crafting campaigns for Fortune 500 brands. Generate a complete, professional advertisement campaign.

PRODUCT: ${opts.productName}
DESCRIPTION: ${opts.productDesc}
TONE: ${toneDesc}
PLATFORMS: ${platformStr}
${audienceStr}
${langStr}
${brandStr}
${addStr}
${templateStr}

Return ONLY a valid JSON object with exactly these keys (no markdown, no code blocks, no extra text):
{
  "headline": "A powerful, memorable main headline that stops the scroll. Max 12 words. Emotionally compelling and benefit-driven.",
  "tagline": "A concise brand tagline or slogan. Max 8 words. Memorable, encapsulates the brand promise.",
  "adCopy": "Full advertisement body copy. 3-5 sentences, persuasive and on-brand. Must include at least one specific benefit and one emotional trigger. 50-100 words.",
  "callToAction": "A strong, specific CTA phrase that creates urgency. Max 6 words. Use action verbs like Get, Start, Join, Discover, Unlock.",
  "targetAudience": "Detailed target audience profile in 2-3 sentences covering demographics (age, income, location), psychographics (values, aspirations), and behavioral patterns (purchase habits, media consumption).",
  "keyBenefits": "3 key product benefits as bullet points. Each starts with a strong verb. Format each on a new line starting with •",
  "platformVersions": "Adapted copy notes for each requested platform. 1-2 sentences per platform explaining how the core message adapts to that platform's format, audience behavior, and character limits."
}

IMPORTANT RULES:
- The headline MUST be attention-grabbing and specific (no generic phrases)
- The CTA MUST use strong action verbs
- Ad copy should tell a story, not just list features
- Platform adaptations must reference platform-specific best practices
- Maintain the ${toneDesc} tone consistently across ALL sections
- Be original and creative — avoid cliches and overused marketing phrases`;
}

/**
 * Section-specific prompt templates for regenerating individual cards.
 */
export const SECTION_PROMPTS: Record<string, (opts: {
  name: string;
  desc: string;
  tone: string;
  platforms: string;
  language?: string;
  brandVoice?: string;
  additionalInstructions?: string;
}) => string> = {
  headline: (o) =>
    `Generate ONE powerful, memorable advertisement headline for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 12 words. Emotionally compelling and benefit-driven.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the headline text, nothing else.`,
  tagline: (o) =>
    `Generate ONE concise brand tagline/slogan for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 8 words. Memorable, encapsulates brand promise.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the tagline text, nothing else.`,
  adCopy: (o) =>
    `Write advertisement body copy for "${o.name}" (${o.desc}). Tone: ${o.tone}. 3-5 sentences, 50-100 words. Must include one specific benefit and one emotional trigger.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the ad copy text.`,
  callToAction: (o) =>
    `Generate ONE strong call-to-action phrase for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 6 words. Use action verbs (Get, Start, Join, Discover, Unlock).${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the CTA text, nothing else.`,
  targetAudience: (o) =>
    `Write a detailed target audience profile for "${o.name}" (${o.desc}). Tone: ${o.tone}. 2-3 sentences covering demographics, psychographics, and behavior.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the audience profile text.`,
  keyBenefits: (o) =>
    `List 3 key product benefits for "${o.name}" (${o.desc}). Tone: ${o.tone}. Each benefit on a new line starting with •. Start each with a strong verb.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the benefits list.`,
  platformVersions: (o) =>
    `Write adapted copy notes for each platform (${o.platforms}) for "${o.name}" (${o.desc}). Tone: ${o.tone}. 1-2 sentences per platform with platform-specific adaptations.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the platform adaptations.`,
};

/**
 * Template-specific prompt additions
 */
export const TEMPLATE_PROMPTS: Record<string, string> = {
  "product-launch": "Focus on novelty and innovation. Highlight what's new and why it matters. Build anticipation and excitement.",
  "flash-sale": "Include a sense of urgency. Mention limited time/quantity. Use countdown-style language. Make the offer irresistible.",
  "brand-awareness": "Focus on brand story and values. Build emotional connection. Prioritize memorability over conversion. Make the brand the hero.",
  "event-promotion": "Emphasize the experience and exclusivity. Include date/time details. Create FOMO. Make it sound unmissable.",
  "saas-trial": "Highlight the value proposition and ease of onboarding. Emphasize 'free' and 'no commitment'. Address common objections.",
  "ecommerce-holiday": "Tap into seasonal emotions. Create gift-giving scenarios. Use holiday-themed language. Emphasize savings and limited availability.",
  "app-download": "Focus on instant gratification. Highlight ease of use. Emphasize mobile-first experience. Include social proof.",
  "newsletter-signup": "Emphasize exclusive content and insider access. Highlight the value of subscribing. Make it feel like joining a community.",
  "retargeting": "Acknowledge past interest. Create a sense of 'we saved this for you'. Offer an incentive to return. Use warm, familiar language.",
  "partnership": "Emphasize the collaboration's unique value. Highlight what each party brings. Create excitement about the combined offering.",
};

/**
 * Provider descriptions for UI display
 */
export const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  deepseek: "DeepSeek V3 — Powerful reasoning and creative copy with excellent JSON compliance",
  gemini: "Gemini 2.0 Flash — Fast, creative, and versatile for all ad formats",
  glm: "GLM-4 Flash — Precise, multilingual, and structured output specialist",
};
