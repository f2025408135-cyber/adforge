/**
 * AdForge — Prompt Templates for AI Generation (v2.0 — Enhanced)
 *
 * All prompt engineering logic lives here. Both /api/generate and
 * /api/regenerate import from this module.
 *
 * PROMPT PHILOSOPHY (v2.0):
 * - Use real advertising frameworks (AIDA, PAS, FAB)
 * - Demand specific, concrete language — ban marketing clichés
 * - Give examples of good vs bad output
 * - Constrain output length to force punchiness
 * - Each section must earn its place — no filler allowed
 * - Generate image prompt suggestions for poster creation
 * - Produce more detailed, actionable content
 */

export const TONE_MAP: Record<string, string> = {
  professional: "authoritative, credible, and direct. No fluff. Sound like a trusted advisor, not a salesperson.",
  luxury: "aspirational and exclusive. Evoke rarity and privilege. Use refined, evocative language. Every word must feel expensive.",
  casual: "warm, conversational, like talking to a smart friend. Use contractions. Be relatable, not corporate.",
  urgent: "high-urgency, action-driven. Short punchy sentences. Create legitimate scarcity or time pressure. No fake urgency.",
  humorous: "witty, clever, and irreverent. Use unexpected comparisons or observations. Humor should serve the message, not distract.",
  inspirational: "emotional and aspirational. Paint a vivid picture of transformation. Use sensory language and concrete imagery.",
  playful: "fun, energetic, and spirited. Use wordplay and vivid verbs. Feel like a brand that doesn't take itself too seriously.",
  minimalist: "ultra-concise and intentional. Every word must earn its place. White space is your friend. Think Apple, not Amazon.",
  bold: "provocative and unapologetic. Make strong claims you can back up. Challenge the status quo. Be polarizing — stand for something.",
  empathetic: "understanding and caring. Acknowledge real pain points with specificity. Show you've been there. Warm without being weak.",
  technical: "precise, data-backed, and authoritative. Use specific numbers and measurable claims. Appeal to the analytical mind.",
  storytelling: "narrative-driven and immersive. Open with a hook. Build tension. Deliver a satisfying resolution that ties to the product.",
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
 * BANNED PHRASES — these produce generic, forgettable copy.
 * The AI is instructed to never use these.
 */
const BANNED_PHRASES = `
BANNED PHRASES — Never use these or variations:
- "elevate your experience", "game-changer", "revolutionary", "cutting-edge", "next-generation"
- "seamless", "innovative solution", "empower", "unlock your potential"
- "unleash", "transform your [x]", "redefine [x]", "take [x] to the next level"
- "in today's world", "in a world where", "imagine a world"
- "don't miss out", "act now", generic superlatives without proof
Instead, use SPECIFIC, CONCRETE, SURPRISING language. Show, don't tell.`;

/**
 * Build the main campaign generation prompt (v2.0 — Enhanced).
 * Now includes image prompt suggestions for poster generation.
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
    : "Identify the single most profitable audience segment — be specific about who they are and what keeps them up at night.";
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

  return `You are an elite advertising copywriter at Crispin Porter + Bogusky — the agency known for campaigns people actually remember. You write copy that makes people STOP, FEEL, and ACT. Not corporate mush.

${BANNED_PHRASES}

BRIEF:
PRODUCT: ${opts.productName}
DESCRIPTION: ${opts.productDesc}
TONE: ${toneDesc}
PLATFORMS: ${platformStr}
${audienceStr}
${langStr}
${brandStr}
${addStr}
${templateStr}

ADVERTISING FRAMEWORK — Use AIDA (Attention → Interest → Desire → Action):
- Headline = ATTENTION hook (pattern interrupt, contradiction, or bold claim)
- Ad Copy = INTEREST + DESIRE (identify pain, agitate it, present solution with proof)
- CTA = ACTION (clear, specific, frictionless next step)

Return ONLY a valid JSON object with exactly these keys (no markdown, no code blocks, no extra text):
{
  "headline": "ATTENTION HOOK. Max 10 words. Must be a pattern interrupt — a contradiction, a bold claim, or a question that demands an answer. NOT a product description. EXAMPLES OF GOOD HEADLINES: 'Your morning coffee is lying to you.' / '48 hours of silence. Starting now.' / 'We broke the rules. Your ears will thank us.'",
  "tagline": "BRAND SLOGAN. Max 6 words. Must be memorizable after one read. Rhythm, rhyme, or contrast help. EXAMPLES: 'Think Different.' / 'Just Do It.' / 'Noise Off. Life On.'",
  "adCopy": "BODY COPY using PAS framework (Problem → Agitate → Solve). 4-6 sentences. Open with the pain point (specific, relatable). Agitate with a vivid detail that makes the reader feel the pain. Present the product as the specific answer with a concrete proof point. Close with a forward-looking statement. 60-100 words total.",
  "callToAction": "CTA. Max 4 words. One clear action verb + one clear benefit. EXAMPLES: 'Claim Your Silence' / 'Start Free' / 'See It In Action'",
  "targetAudience": "AUDIENCE PROFILE. 3-4 sentences. Be NARROW — name a specific person, not 'everyone'. Include: what they do, what frustrates them, what they secretly want, and why current solutions fail them. NO generic demographics.",
  "keyBenefits": "4 BENEFIT statements. Each on a new line starting with •. Format: • [Verb] + [Specific outcome] + [Proof/Reason]. NOT features. Each benefit should be distinct (performance, emotional, social, financial). EXAMPLE: '• Cut through airplane noise with AI that learns your environment in 0.3 seconds'",
  "platformVersions": "For EACH platform listed, write 2-3 lines of PLATFORM-SPECIFIC COPY (not strategy notes). Write the actual post/ad text tailored to that platform's format, character limits, and audience behavior. Include relevant hashtags for social platforms. Label each platform.",
  "posterPrompt": "A detailed image generation prompt for creating an ad poster/creative visual for this campaign. Describe the visual composition, color palette, typography style, mood, and key visual elements. This will be used by an AI image generator to create the actual poster. Be very specific about layout, colors, and visual style. Max 200 words. Do NOT mention real people — use illustrations or abstract visuals."
}

QUALITY GATES:
- If any headline word could be swapped for a competitor's product name, it's too generic — rewrite it
- If the CTA could work for any product, it's too generic — make it product-specific
- If a benefit describes a feature not an outcome, rewrite it as an outcome
- Read the headline aloud. If it doesn't make you curious, it's not good enough
- The ad copy must contain at least one specific number, data point, or concrete detail
- The posterPrompt should describe a visually striking, professional advertisement`;
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
    `Write ONE advertisement headline for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 10 words. Must be a PATTERN INTERRUPT — a contradiction, bold claim, or question. NOT a product description. BAD: "The Best Earbuds for Professionals" GOOD: "Your ears deserve a raise."${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the headline text.`,
  tagline: (o) =>
    `Write ONE brand tagline for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 6 words. Must be memorizable after ONE read. Use rhythm, contrast, or wordplay. BAD: "Innovation You Can Trust" GOOD: "Noise Off. Life On."${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the tagline text.`,
  adCopy: (o) =>
    `Write ad body copy for "${o.name}" (${o.desc}). Tone: ${o.tone}. Use PAS: Problem → Agitate → Solve. 4-6 sentences, 60-100 words. Open with specific pain. Agitate with vivid detail. Close with product as answer with a concrete proof point. NO feature lists. NO clichés. Include at least one specific number or data point.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the ad copy text.`,
  callToAction: (o) =>
    `Write ONE CTA for "${o.name}" (${o.desc}). Tone: ${o.tone}. Max 4 words. One action verb + one clear benefit. BAD: "Shop Now" GOOD: "Claim Your Silence"${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the CTA text.`,
  targetAudience: (o) =>
    `Write a NARROW target audience profile for "${o.name}" (${o.desc}). Tone: ${o.tone}. 3-4 sentences. Name a specific person — what they do, what frustrates them, what they secretly want, and why current solutions fail them. NOT generic demographics.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""}${o.brandVoice ? ` Brand voice: ${o.brandVoice}.` : ""} Return ONLY the audience profile text.`,
  keyBenefits: (o) =>
    `Write 4 benefit statements for "${o.name}" (${o.desc}). Tone: ${o.tone}. Each on new line starting with •. Format: • [Verb] + [Specific outcome] + [Proof]. Each benefit should cover a distinct angle (performance, emotional, social, financial). BAD: "• Great sound quality" GOOD: "• Hear conversations in crowded rooms with AI that isolates voices in 0.3s"${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the benefits list.`,
  platformVersions: (o) =>
    `Write PLATFORM-SPECIFIC AD COPY (not strategy notes) for each platform (${o.platforms}) for "${o.name}" (${o.desc}). Tone: ${o.tone}. Write the actual post/ad text for each platform, tailored to its format and audience. Include relevant hashtags for social platforms. 2-3 lines per platform. Label each platform.${o.language && o.language !== "en" ? ` Write in ${LANGUAGE_MAP[o.language]}.` : ""} Return ONLY the platform-specific copy.`,
  posterPrompt: (o) =>
    `Write a detailed image generation prompt for creating an ad poster for "${o.name}" (${o.desc}). Tone: ${o.tone}. Describe: visual composition, color palette, typography style, mood, key visual elements, layout. Be very specific. No real people — use illustrations or abstract visuals. Max 200 words. Return ONLY the image prompt text.`,
};

/**
 * Template-specific prompt additions
 */
export const TEMPLATE_PROMPTS: Record<string, string> = {
  "product-launch": "This is a NEW product launch. Lead with the SINGLE most surprising thing about this product. Build curiosity before revealing what it is. Create an 'I need to see this' moment.",
  "flash-sale": "URGENCY FRAMEWORK: State the deal first. Then the deadline. Then the consequence of missing it. Legitimate scarcity only — no fake countdowns. Make the offer so specific it feels like a secret.",
  "brand-awareness": "BRAND STORY approach: Don't sell the product — sell the belief system behind it. What does this brand stand FOR and AGAINST? Make the reader feel like they belong to a tribe.",
  "event-promotion": "EVENT FRAMEWORK: Sell the FEELING of being there, not the agenda. What happens in the room that can't happen anywhere else? Create genuine FOMO through specific details, not hype.",
  "saas-trial": "REDUCE FRICTION: The #1 objection is 'it's not worth the setup time.' Address it in the first sentence. Show the fastest path to a 'wow' moment. Quantify the time-to-value.",
  "ecommerce-holiday": "GIFT-FRAME: Don't sell the product — sell the moment of giving it. Describe the receiver's reaction. Paint the holiday scene. Then show how this gift delivers that moment.",
  "app-download": "INSTANT GRATIFICATION: What can the user do in the FIRST 60 seconds after downloading? Lead with that. Skip the onboarding pitch — sell the immediate payoff.",
  "newsletter-signup": "INSIDER ANGLE: What's the ONE thing the subscriber will know that everyone else doesn't? Sell the information asymmetry. Make unsubscribing feel like leaving a secret society.",
  "retargeting": "WELCOME BACK: Acknowledge they've been here before. Reference what they looked at. Make it feel personal, not creepy. Offer a specific reason to return NOW — not just a discount.",
  "partnership": "COMBINATION EFFECT: Why is 1+1=3 here? What can these two brands do together that neither could alone? Lead with the unique value of the collaboration itself.",
};

/**
 * Provider descriptions for UI display
 */
export const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  adforge: "AdForge AI — Built-in, always ready. No API key needed. Fast, creative, and free",
  deepseek: "DeepSeek V4 Flash — Advanced reasoning model with blazing speed and creative, structured ad copy",
  gemini: "Gemini 2.5 Flash — Fast, creative, and versatile for all ad formats",
  glm: "GLM-4 Flash — Precise, multilingual, and structured output specialist",
};
