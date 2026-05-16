import { TONE_MAP } from './ai-providers';

export const MAIN_PROMPT_TEMPLATE = `You are a senior advertising strategist and master copywriter at a top-tier creative agency with 20+ years of experience crafting campaigns for Fortune 500 brands. Your task is to generate a complete, professional advertisement campaign.

PRODUCT: {{productName}}
DESCRIPTION: {{productDesc}}
TONE: {{toneDescription}}
PLATFORMS: {{platformList}}
TARGET AUDIENCE: {{audience}}
LANGUAGE: {{language}}
{{#brandVoice}}BRAND VOICE: {{brandVoice}}{{/brandVoice}}
{{#additionalInstructions}}ADDITIONAL INSTRUCTIONS: {{additionalInstructions}}{{/additionalInstructions}}

Generate a campaign with EXACTLY these 7 sections. Return ONLY a valid JSON object with these keys (no markdown, no code blocks, no extra text):

{
  "headline": "A powerful, memorable main headline that stops the scroll. Max 12 words. Must be emotionally compelling and benefit-driven.",
  "tagline": "A concise brand tagline or slogan. Max 8 words. Should be memorable and encapsulate the brand promise.",
  "adCopy": "Full advertisement body copy. 3-5 sentences, persuasive and on-brand. Must include at least one specific benefit and one emotional trigger.",
  "callToAction": "A strong, specific CTA phrase that creates urgency. Max 6 words. Use action verbs.",
  "targetAudience": "Detailed target audience profile in 2-3 sentences covering demographics (age, income, location), psychographics (values, aspirations), and behavioral patterns (purchase habits, media consumption).",
  "keyBenefits": "3 key product benefits as bullet points. Each starts with a strong verb. Format: • [Benefit 1]\\n• [Benefit 2]\\n• [Benefit 3]",
  "platformVersions": "Adapted copy notes for each requested platform. 1-2 sentences per platform explaining how the core message adapts to that platform's format, audience behavior, and character limits."
}

IMPORTANT RULES:
- The headline MUST be attention-grabbing and specific (no generic phrases)
- The CTA MUST use strong action verbs (Get, Start, Join, Discover, Unlock)
- Ad copy should tell a story, not just list features
- Platform adaptations must reference platform-specific best practices
- Maintain the {{toneDescription}} tone consistently across ALL sections
- Be original and creative — avoid cliches and overused marketing phrases
- If the language is not English, generate ALL content in that language`;

export function buildPrompt(params: {
  productName: string;
  productDesc: string;
  tone: string;
  audience?: string;
  platforms: string[];
  brandVoice?: string;
  language?: string;
  additionalInstructions?: string;
}): string {
  let prompt = MAIN_PROMPT_TEMPLATE;

  prompt = prompt.replace('{{productName}}', params.productName);
  prompt = prompt.replace('{{productDesc}}', params.productDesc);
  prompt = prompt.replace('{{toneDescription}}', TONE_MAP[params.tone] || 'professional');
  prompt = prompt.replace('{{platformList}}', params.platforms.join(', '));
  prompt = prompt.replace('{{audience}}', params.audience || 'Identify the most suitable target audience.');
  prompt = prompt.replace('{{language}}', params.language === 'en' ? 'English' : params.language || 'English');

  if (params.brandVoice) {
    prompt = prompt.replace('{{#brandVoice}}BRAND VOICE: {{brandVoice}}{{/brandVoice}}', `BRAND VOICE: ${params.brandVoice}`);
  } else {
    prompt = prompt.replace('{{#brandVoice}}BRAND VOICE: {{brandVoice}}{{/brandVoice}}', '');
  }

  if (params.additionalInstructions) {
    prompt = prompt.replace('{{#additionalInstructions}}ADDITIONAL INSTRUCTIONS: {{additionalInstructions}}{{/additionalInstructions}}', `ADDITIONAL INSTRUCTIONS: ${params.additionalInstructions}`);
  } else {
    prompt = prompt.replace('{{#additionalInstructions}}ADDITIONAL INSTRUCTIONS: {{additionalInstructions}}{{/additionalInstructions}}', '');
  }

  return prompt;
}

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'product-launch': ' Include a sense of newness and innovation. Emphasize the launch date and exclusivity. Build anticipation and excitement.',
  'flash-sale': ' Include a sense of urgency. Mention limited time/quantity. Use countdown-style language. Create FOMO (fear of missing out).',
  'brand-awareness': ' Focus on brand story and values. Build emotional connection. Prioritize memorability over conversion. Use distinctive brand voice.',
  'event-promotion': ' Include event details (date, time, location). Emphasize what's unique about this event. Include registration/booking CTA.',
  'saas-free-trial': ' Emphasize the free aspect. Highlight ease of getting started. Mention key features available in trial. Address common objections.',
  'ecommerce-holiday': ' Incorporate holiday themes and emotions. Include seasonal gift-giving angles. Emphasize limited-time offers.',
  'app-download': ' Emphasize ease of download. Highlight key app features. Include social proof or ratings. Make it feel essential.',
  'newsletter-signup': ' Promise specific value (what they'll get). Make it feel exclusive. Keep the barrier low. Emphasize what they\'re missing.',
  'retargeting': ' Acknowledge they\'ve shown interest before. Offer something new or remind of value. Include strong incentive.',
  'partnership-announcement': ' Highlight the collaboration benefits. Make both parties look good. Emphasize what this means for customers.',
};