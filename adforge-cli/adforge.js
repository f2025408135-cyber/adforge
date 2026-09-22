#!/usr/bin/env node

/**
 * AdForge CLI v3.0 — AI-Powered Ad Campaign Generator with Poster Creation
 * 
 * Usage:
 *   node adforge.js "Product Name" "Product Description" [options]
 * 
 * Options:
 *   --tone <tone>        Campaign tone (default: professional)
 *   --platforms <list>   Comma-separated platforms (default: instagram,facebook)
 *   --audience <text>    Target audience
 *   --language <lang>    Output language (default: english)
 *   --creativity <0-100> Creativity level (default: 70)
 *   --provider <name>    AI provider: adforge, deepseek, gemini, glm (default: adforge)
 *   --output <format>    Output format: terminal, json, md, txt (default: terminal)
 *   --save <filename>    Save output to file
 *   --enhance            Enhance the product description with AI first
 *   --poster             Generate ad poster images (saved as PNG files)
 *   --poster-dir <dir>   Directory to save poster images (default: ./adforge-posters)
 * 
 * Examples:
 *   node adforge.js "Nike Air Max" "Revolutionary running shoe"
 *   node adforge.js "My SaaS" "Project management tool" --tone bold --platforms linkedin,twitter
 *   node adforge.js "Coffee Shop" "Artisan coffee" --tone casual --enhance --poster --save campaign.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ZAI from 'z-ai-web-dev-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-53387238d28b4746abb40dff4b291c9d';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBZ06CeUHMLwc00w48tgDBS8iCWGPCwEU0';
const GLM_API_KEY = process.env.GLM_API_KEY || '';

const TONES = [
  'professional', 'luxury', 'casual', 'urgent', 'humorous', 'inspirational',
  'playful', 'minimalist', 'bold', 'empathetic', 'technical', 'storytelling',
];

const PLATFORMS = [
  'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube',
  'billboard', 'email', 'google-ads',
];

const LANGUAGES = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'arabic', 'hindi', 'urdu'];

// ─── Colors ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  orange: '\x1b[38;5;208m',
  terra: '\x1b[38;5;166m',
  ink: '\x1b[38;5;236m',
  cream: '\x1b[48;5;230m',
  purple: '\x1b[38;5;93m',
};

function bold(text) { return `${c.bold}${text}${c.reset}`; }
function dim(text) { return `${c.dim}${text}${c.reset}`; }
function green(text) { return `${c.green}${text}${c.reset}`; }
function red(text) { return `${c.red}${text}${c.reset}`; }
function orange(text) { return `${c.orange}${text}${c.reset}`; }
function terra(text) { return `${c.terra}${text}${c.reset}`; }
function cyan(text) { return `${c.cyan}${text}${c.reset}`; }
function purple(text) { return `${c.purple}${text}${c.reset}`; }

// ─── Parse Args ──────────────────────────────────────────────────────

function parseArgs(args) {
  const positional = [];
  const flags = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(args[i]);
    }
  }
  
  return { positional, flags };
}

// ─── AI Providers ────────────────────────────────────────────────────

async function callDeepSeek(prompt, temperature = 0.7) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: 'You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    tokens: (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  };
}

async function callGemini(prompt, temperature = 0.7) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: 'You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand.' }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(120000),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    tokens: data.usageMetadata?.totalTokenCount || 0,
  };
}

async function callGLM(prompt, temperature = 0.7) {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: 'You are a senior advertising strategist and master copywriter. Always respond with valid JSON when asked.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) throw new Error(`GLM API error: ${response.status}`);

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    tokens: (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
  };
}

async function callAdforgeAI(prompt, creativity) {
  const temperature = creativity <= 33 ? 0.3 : creativity <= 66 ? 0.7 : 1.0;
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a senior advertising strategist and master copywriter at a top-tier creative agency. Always respond with valid JSON when asked. Be creative, specific, and on-brand.' },
      { role: 'user', content: prompt },
    ],
    temperature,
  });
  return {
    text: completion.choices?.[0]?.message?.content || '',
    tokens: completion.usage?.total_tokens || 0,
  };
}

async function callAI(provider, prompt, creativity) {
  const temperature = creativity <= 33 ? 0.3 : creativity <= 66 ? 0.7 : 1.0;

  switch (provider) {
    case 'adforge':
      return callAdforgeAI(prompt, creativity);
    case 'gemini':
      if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set. Use --provider adforge or set the env var.');
      return callGemini(prompt, temperature);
    case 'glm':
      if (!GLM_API_KEY) throw new Error('GLM_API_KEY not set. Use --provider adforge or set the env var.');
      return callGLM(prompt, temperature);
    case 'deepseek':
    default:
      if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not set. Use --provider adforge.');
      return callDeepSeek(prompt, temperature);
  }
}

// ─── Poster Generation ───────────────────────────────────────────────

const POSTER_SIZES = {
  instagram: { zaiSize: '1024x1024', label: 'Instagram Post' },
  'instagram-story': { zaiSize: '768x1344', label: 'Instagram Story' },
  facebook: { zaiSize: '1344x768', label: 'Facebook Ad' },
  linkedin: { zaiSize: '1344x768', label: 'LinkedIn Post' },
  twitter: { zaiSize: '1344x768', label: 'Twitter/X Post' },
  billboard: { zaiSize: '1440x720', label: 'Billboard' },
  youtube: { zaiSize: '1344x768', label: 'YouTube Thumbnail' },
  general: { zaiSize: '1024x1024', label: 'General Ad' },
};

const STYLE_PRESETS = {
  professional: 'clean, modern, corporate professional design, minimalist layout, premium quality',
  luxury: 'ultra-luxurious, high-end fashion editorial style, gold accents, elegant serif typography',
  casual: 'warm, friendly, approachable design, soft colors, hand-drawn elements',
  urgent: 'bold, high-contrast, attention-grabbing design, red accents, large impact typography',
  humorous: 'playful, witty design, bright colors, unexpected visual elements',
  inspirational: 'inspiring, aspirational design, dramatic lighting, cinematic feel',
  playful: 'vibrant, energetic design, bold colors, dynamic shapes',
  minimalist: 'ultra-clean minimalist design, lots of white space, single focal point',
  bold: 'striking, provocative design, high contrast, oversized typography',
  empathetic: 'warm, caring design, soft tones, human connection imagery',
  technical: 'sleek, futuristic tech design, data visualization elements, blue tones',
  storytelling: 'narrative design, cinematic composition, story-driven imagery',
};

async function generatePosters({ productName, productDesc, headline, tagline, callToAction, tone, platforms, posterPrompt, posterDir }) {
  const zai = await ZAI.create();
  const dir = posterDir || './adforge-posters';

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const targetPlatforms = platforms
    .filter(p => POSTER_SIZES[p])
    .slice(0, 3); // Max 3 posters

  if (targetPlatforms.length === 0) {
    targetPlatforms.push('instagram', 'facebook');
  }

  const toneStyle = STYLE_PRESETS[tone] || STYLE_PRESETS.professional;
  const customStyle = posterPrompt ? `, ${posterPrompt}` : '';

  const results = [];

  for (const platform of targetPlatforms) {
    const sizeInfo = POSTER_SIZES[platform];
    const ctaText = callToAction ? ` with call-to-action "${callToAction}"` : '';
    const taglineText = tagline ? ` and tagline "${tagline}"` : '';

    const prompt = `Professional advertisement poster for "${productName}". ${productDesc ? `Product: ${productDesc}. ` : ""}Headline: "${headline}"${taglineText}${ctaText}. Style: ${toneStyle}${customStyle}. Design: No real photos of people, use illustrations or abstract visuals instead. Professional graphic design, ready-to-publish ad creative. High quality, commercial grade.`;

    try {
      startSpinner(`Generating ${sizeInfo.label} poster...`);
      const response = await zai.images.generations.create({
        prompt,
        size: sizeInfo.zaiSize,
      });
      stopSpinner();

      const imageBase64 = response.data?.[0]?.base64;
      if (!imageBase64) throw new Error('No image data returned');

      const filename = `${productName.replace(/\s+/g, '-').toLowerCase()}-${platform}-poster.png`;
      const filepath = join(dir, filename);

      // Decode base64 and save as PNG
      const buffer = Buffer.from(imageBase64, 'base64');
      writeFileSync(filepath, buffer);

      results.push({ platform, label: sizeInfo.label, filepath, size: sizeInfo.zaiSize });
      console.log(`  ${green('✓')} ${sizeInfo.label} saved: ${dim(filepath)}`);
    } catch (err) {
      stopSpinner();
      console.log(`  ${red('✗')} ${sizeInfo.label} failed: ${err.message}`);
    }
  }

  return results;
}

// ─── Prompt Builder ──────────────────────────────────────────────────

function buildPrompt({ productName, productDesc, tone, platforms, audience, language, creativity }) {
  const toneMap = {
    professional: 'authoritative, credible, and direct. No fluff.',
    luxury: 'aspirational and exclusive. Evoke rarity and privilege.',
    casual: 'warm and conversational, like talking to a smart friend.',
    urgent: 'high-urgency, short punchy sentences. Legitimate scarcity only.',
    humorous: 'witty, clever, irreverent. Humor serves the message.',
    inspirational: 'emotional and aspirational. Paint a vivid transformation.',
    playful: 'fun, energetic, spirited. Use wordplay and vivid verbs.',
    minimalist: 'ultra-concise. Every word earns its place. White space is your friend.',
    bold: 'provocative and unapologetic. Challenge the status quo.',
    empathetic: 'understanding and caring. Acknowledge real pain specifically.',
    technical: 'precise, data-backed. Use specific numbers and measurable claims.',
    storytelling: 'narrative-driven. Open with a hook. Build tension. Deliver resolution.',
  };
  const toneDesc = toneMap[tone] || toneMap.professional;

  return `You are an elite advertising copywriter at Crispin Porter + Bogusky — the agency known for campaigns people actually remember. You write copy that makes people STOP, FEEL, and ACT. Not corporate mush.

BANNED PHRASES — Never use these: "elevate your experience", "game-changer", "revolutionary", "cutting-edge", "next-generation", "seamless", "innovative solution", "empower", "unlock your potential", "unleash", "transform your", "redefine", "take to the next level", "in today's world", "imagine a world". Use SPECIFIC, CONCRETE, SURPRISING language instead. Show, don't tell.

BRIEF:
PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${toneDesc}
TARGET PLATFORMS: ${platforms.join(', ')}
${audience ? `TARGET AUDIENCE: ${audience}` : 'Identify the single most profitable audience segment — be specific about who they are and what keeps them up at night.'}
LANGUAGE: ${language}
CREATIVITY: ${creativity <= 33 ? 'Conservative & safe' : creativity <= 66 ? 'Balanced & professional' : 'Highly creative & bold'}

ADVERTISING FRAMEWORK — Use AIDA (Attention > Interest > Desire > Action):
- Headline = ATTENTION hook (pattern interrupt, contradiction, or bold claim)
- Ad Copy = INTEREST + DESIRE (identify pain, agitate it, present solution with proof)
- CTA = ACTION (clear, specific, frictionless next step)

Return a JSON object with EXACTLY these keys:
{
  "headline": "ATTENTION HOOK. Max 10 words. Pattern interrupt — contradiction, bold claim, or question. NOT a product description. GOOD: 'Your morning coffee is lying to you.' BAD: 'The Best Earbuds for Professionals'",
  "tagline": "BRAND SLOGAN. Max 6 words. Memorizable after one read. GOOD: 'Noise Off. Life On.' BAD: 'Innovation You Can Trust'",
  "adCopy": "BODY COPY using PAS (Problem > Agitate > Solve). 4-6 sentences, 60-100 words. Open with specific pain. Agitate with vivid detail. Close with product as answer with concrete proof point. NO feature lists. NO clichés. Include at least one specific number or data point.",
  "callToAction": "CTA. Max 4 words. One action verb + one clear benefit. GOOD: 'Claim Your Silence' BAD: 'Shop Now'",
  "targetAudience": "NARROW audience profile. 3-4 sentences. Name a specific person — what they do, what frustrates them, what they secretly want, why current solutions fail them. NOT generic demographics.",
  "keyBenefits": "4 benefit statements, each on new line starting with •. Format: • [Verb] + [Specific outcome] + [Proof]. Each benefit should cover a distinct angle (performance, emotional, social, financial). BAD: 'Great sound quality' GOOD: 'Hear conversations in crowded rooms with AI that isolates voices in 0.3s'",
  "platformVersions": "For EACH platform, write 2-3 lines of PLATFORM-SPECIFIC AD COPY (not strategy notes). The actual post/ad text. Include relevant hashtags for social platforms. Label each platform.",
  "posterPrompt": "Detailed image generation prompt for creating an ad poster/creative visual. Describe visual composition, color palette, typography style, mood, key visual elements. Be very specific about layout, colors, and visual style. Max 200 words. No real people — use illustrations or abstract visuals."
}

QUALITY GATES:
- If any headline word could be swapped for a competitor's product name, it's too generic — rewrite it
- If the CTA could work for any product, it's too generic — make it product-specific
- If a benefit describes a feature not an outcome, rewrite it as an outcome
- The ad copy must contain at least one specific number, data point, or concrete detail
- Return ONLY valid JSON, no markdown, no code blocks`;
}

function buildEnhancePrompt({ productName, productDesc }) {
  return `You are a marketing expert. Enhance and expand this product description to make it more compelling for ad campaign generation.

PRODUCT: ${productName}
CURRENT DESCRIPTION: ${productDesc}

Return ONLY the enhanced description text (no JSON, no markdown, no quotes). Make it:
- More vivid and specific
- Include unique selling points
- Add emotional appeal
- Keep it under 200 words`;
}

function buildRegeneratePrompt({ sectionKey, productName, productDesc, tone, platforms, language, creativity }) {
  const sectionMap = {
    headline: 'headline (under 12 words, attention-grabbing)',
    tagline: 'tagline (under 8 words, memorable)',
    adCopy: 'ad copy body (100-150 words, persuasive)',
    callToAction: 'call-to-action phrase (under 6 words, compelling)',
    targetAudience: 'target audience description (50-80 words, specific)',
    keyBenefits: 'key benefits as bullet points (60-80 words total)',
    platformVersions: 'platform-specific adaptations (100-150 words, tailored per platform)',
  };

  return `You are an expert advertising copywriter. Regenerate ONLY the "${sectionKey}" section of an ad campaign.

PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${tone}
PLATFORMS: ${platforms.join(', ')}
LANGUAGE: ${language}
CREATIVITY: ${creativity <= 33 ? 'Conservative' : creativity <= 66 ? 'Balanced' : 'Highly creative'}

Return a JSON object with exactly one key:
{
  "${sectionKey}": ${sectionMap[sectionKey] ? `"the regenerated ${sectionMap[sectionKey]} content"` : '"regenerated content"'}
}

Return ONLY valid JSON. No markdown, no code blocks.`;
}

// ─── JSON Parser ─────────────────────────────────────────────────────

function parseAIResponse(raw) {
  const clean = raw.replace(/```json\s*|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    throw new Error('AI returned invalid JSON. Try again.');
  }
}

// ─── Display ─────────────────────────────────────────────────────────

function printBanner() {
  console.log(`
${terra(bold('  █████╗ ██████╗ ████████╗███████╗██████╗ '))}
${terra(bold(' ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗'))}
${terra(bold(' ███████║██████╔╝   ██║   █████╗  ██████╔╝'))}
${terra(bold(' ██╔══██║██╔═══╝    ██║   ██╔══╝  ██╔══██╗'))}
${terra(bold(' ██║  ██║██║        ██║   ███████╗██║  ██║'))}
${terra(bold(' ╚═╝  ╚═╝╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝'))}
${dim('  AI-Powered Ad Campaign Generator — v3.0 with Posters')}
`);
}

function printCampaign(result, productName, tone, provider, tokensUsed) {
  const label = (icon, text) => `  ${icon} ${bold(cyan(text.toUpperCase()))}`;
  const divider = () => dim('  ' + '─'.repeat(55));
  
  console.log(`\n${divider()}`);
  console.log(`${bold(green('  ✅ CAMPAIGN GENERATED'))}  ${dim(`│ ${productName} │ ${tone} │ ${provider} │ ${tokensUsed} tokens`)}`);
  console.log(`${divider()}\n`);

  if (result.headline) {
    console.log(label('🎯', 'Headline'));
    console.log(`  ${terra(bold(result.headline))}\n`);
  }

  if (result.tagline) {
    console.log(label('💬', 'Tagline'));
    console.log(`  ${dim('"')}${orange(result.tagline)}${dim('"')}\n`);
  }

  if (result.adCopy) {
    console.log(label('📝', 'Ad Copy'));
    console.log(`  ${result.adCopy}\n`);
  }

  if (result.callToAction) {
    console.log(label('🚀', 'Call to Action'));
    console.log(`  ${bold(green(result.callToAction))}\n`);
  }

  if (result.targetAudience) {
    console.log(label('👥', 'Target Audience'));
    console.log(`  ${result.targetAudience}\n`);
  }

  if (result.keyBenefits) {
    console.log(label('⭐', 'Key Benefits'));
    const benefits = result.keyBenefits.split('\n').filter(l => l.trim());
    for (const b of benefits) {
      console.log(`  ${green('•')} ${b.replace(/^[•\-\*]\s*/, '')}`);
    }
    console.log();
  }

  if (result.platformVersions) {
    console.log(label('📱', 'Platform Adaptations'));
    const lines = result.platformVersions.split('\n').filter(l => l.trim());
    for (const l of lines) {
      console.log(`  ${l}`);
    }
    console.log();
  }

  if (result.posterPrompt) {
    console.log(label('🎨', 'Poster Visual Prompt'));
    console.log(`  ${dim(result.posterPrompt.substring(0, 200))}${result.posterPrompt.length > 200 ? '...' : ''}\n`);
  }

  console.log(divider());
}

function exportMarkdown(result, productName, tone) {
  return `# ${productName} — Ad Campaign

**Tone:** ${tone}
**Generated:** ${new Date().toLocaleDateString()}

## Headline
${result.headline}

## Tagline
*${result.tagline}*

## Ad Copy
${result.adCopy}

## Call to Action
**${result.callToAction}**

## Target Audience
${result.targetAudience}

## Key Benefits
${result.keyBenefits}

## Platform Adaptations
${result.platformVersions}

## Poster Visual Prompt
${result.posterPrompt || 'N/A'}
`;
}

function exportTxt(result, productName) {
  return `${productName} — Ad Campaign
${'='.repeat(50)}

Headline: ${result.headline}
Tagline: ${result.tagline}

Ad Copy:
${result.adCopy}

Call to Action: ${result.callToAction}

Target Audience: ${result.targetAudience}

Key Benefits:
${result.keyBenefits}

Platform Adaptations:
${result.platformVersions}

Poster Prompt:
${result.posterPrompt || 'N/A'}
`;
}

// ─── Spinner ─────────────────────────────────────────────────────────

let spinnerInterval;
function startSpinner(text) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  process.stdout.write(`  ${dim(text)} `);
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r  ${dim(text)} ${frames[i++ % frames.length]}  `);
  }, 80);
}

function stopSpinner() {
  clearInterval(spinnerInterval);
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
}

// ─── Interactive Mode ────────────────────────────────────────────────

async function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function interactiveMode() {
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(orange(bold('\n  🎨 AdForge Interactive Mode\n')));

  const productName = (await askQuestion(rl, `  ${bold('Product Name')} ${dim('(required)')}: `)).trim();
  if (!productName) { console.log(red('\n  Product name is required.')); rl.close(); return null; }

  let productDesc = (await askQuestion(rl, `  ${bold('Product Description')} ${dim('(required)')}: `)).trim();
  if (!productDesc || productDesc.length < 10) { console.log(red('\n  Description must be at least 10 characters.')); rl.close(); return null; }

  const enhanceAnswer = (await askQuestion(rl, `  ${bold('Enhance description with AI?')} ${dim('(y/n)')}: `)).trim().toLowerCase();
  const enhance = enhanceAnswer === 'y' || enhanceAnswer === 'yes';

  console.log(dim(`\n  Available tones: ${TONES.join(', ')}`));
  const tone = (await askQuestion(rl, `  ${bold('Tone')} ${dim(`(default: professional)`)}: `)).trim().toLowerCase() || 'professional';

  console.log(dim(`  Available platforms: ${PLATFORMS.join(', ')}`));
  const platformsInput = (await askQuestion(rl, `  ${bold('Platforms')} ${dim(`(comma-separated, default: instagram,facebook)`)}: `)).trim().toLowerCase();
  const platforms = platformsInput ? platformsInput.split(',').map(p => p.trim()).filter(p => PLATFORMS.includes(p)) : ['instagram', 'facebook'];
  if (platforms.length === 0) platforms.push('instagram', 'facebook');

  const audience = (await askQuestion(rl, `  ${bold('Target Audience')} ${dim('(optional)')}: `)).trim() || '';

  const creativityInput = (await askQuestion(rl, `  ${bold('Creativity')} ${dim('(0-100, default: 70)')}: `)).trim();
  const creativity = Math.max(0, Math.min(100, parseInt(creativityInput) || 70));

  console.log(dim(`  Available languages: ${LANGUAGES.join(', ')}`));
  const language = (await askQuestion(rl, `  ${bold('Language')} ${dim('(default: english)')}: `)).trim().toLowerCase() || 'english';

  const posterAnswer = (await askQuestion(rl, `  ${bold('Generate ad poster images?')} ${dim('(y/n)')}: `)).trim().toLowerCase();
  const poster = posterAnswer === 'y' || posterAnswer === 'yes';

  const saveFile = (await askQuestion(rl, `  ${bold('Save to file?')} ${dim('(filename or leave empty)')}: `)).trim() || '';

  rl.close();

  return { productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider: 'adforge', saveFile, poster };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  // No args = interactive mode
  if (args.length === 0) {
    printBanner();
    const input = await interactiveMode();
    if (!input) process.exit(1);
    await runCampaign(input);
    return;
  }

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    printBanner();
    console.log(dim('  Usage:'));
    console.log(`    node adforge.js "Product Name" "Description" [options]\n`);
    console.log(bold('  Options:'));
    console.log(`    --tone <tone>        Campaign tone (default: professional)`);
    console.log(`    --platforms <list>   Comma-separated platforms (default: instagram,facebook)`);
    console.log(`    --audience <text>    Target audience`);
    console.log(`    --language <lang>    Output language (default: english)`);
    console.log(`    --creativity <0-100> Creativity level (default: 70)`);
    console.log(`    --provider <name>    AI provider: adforge, deepseek, gemini, glm (default: adforge)`);
    console.log(`    --output <format>    Output: terminal, json, md, txt (default: terminal)`);
    console.log(`    --save <filename>    Save output to file`);
    console.log(`    --enhance            Enhance description with AI first`);
    console.log(`    --poster             Generate ad poster images (saved as PNG)`);
    console.log(`    --poster-dir <dir>   Directory for poster images (default: ./adforge-posters)`);
    console.log(`    --interactive, -i    Run in interactive mode`);
    console.log(`    --help, -h           Show this help\n`);
    console.log(bold('  Tones:'));
    console.log(`    ${TONES.join(', ')}\n`);
    console.log(bold('  Platforms:'));
    console.log(`    ${PLATFORMS.join(', ')}\n`);
    console.log(bold('  Examples:'));
    console.log(`    node adforge.js "Nike Air Max" "Revolutionary running shoe"`);
    console.log(`    node adforge.js "My SaaS" "Project management" --tone bold --platforms linkedin,twitter`);
    console.log(`    node adforge.js "Coffee Shop" "Artisan coffee" --enhance --poster --save campaign.md\n`);
    return;
  }

  // Interactive flag
  if (args.includes('--interactive') || args.includes('-i')) {
    printBanner();
    const input = await interactiveMode();
    if (!input) process.exit(1);
    await runCampaign(input);
    return;
  }

  // Parse CLI args
  const { positional, flags } = parseArgs(args);
  
  const productName = positional[0] || '';
  const productDesc = positional[1] || '';

  if (!productName || !productDesc) {
    console.log(red('\n  Error: Product name and description are required.'));
    console.log(dim('  Usage: node adforge.js "Product Name" "Description" [options]'));
    console.log(dim('  Run: node adforge.js --help\n'));
    process.exit(1);
  }

  if (productDesc.length < 10) {
    console.log(red('\n  Error: Description must be at least 10 characters.\n'));
    process.exit(1);
  }

  const tone = flags.tone || 'professional';
  const platformsStr = flags.platforms || 'instagram,facebook';
  const platforms = platformsStr.split(',').map(p => p.trim()).filter(p => PLATFORMS.includes(p));
  if (platforms.length === 0) platforms.push('instagram', 'facebook');
  const audience = flags.audience || '';
  const language = flags.language || 'english';
  const creativity = Math.max(0, Math.min(100, parseInt(flags.creativity) || 70));
  const provider = flags.provider || 'adforge';
  const outputFormat = flags.output || 'terminal';
  const saveFile = flags.save || '';
  const enhance = flags.enhance || false;
  const poster = flags.poster || false;
  const posterDir = flags['poster-dir'] || './adforge-posters';

  printBanner();
  await runCampaign({ productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider, outputFormat, saveFile, poster, posterDir });
}

async function runCampaign({ productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider = 'adforge', outputFormat = 'terminal', saveFile = '', poster = false, posterDir = './adforge-posters' }) {
  let desc = productDesc;

  // Enhance description
  if (enhance) {
    startSpinner('Enhancing description...');
    try {
      const result = await callAI(provider, buildEnhancePrompt({ productName, productDesc }), creativity);
      stopSpinner();
      desc = result.text.trim();
      console.log(`  ${green('✓')} ${bold('Enhanced Description:')}`);
      console.log(`  ${dim(desc.substring(0, 150))}${desc.length > 150 ? '...' : ''}\n`);
    } catch (err) {
      stopSpinner();
      console.log(`  ${red('✗')} Enhancement failed: ${err.message}`);
      console.log(`  ${dim('Using original description...')}\n`);
    }
  }

  // Generate campaign
  startSpinner(`Generating campaign with ${provider}...`);
  let aiResult, tokensUsed;
  try {
    const prompt = buildPrompt({ productName, productDesc: desc, tone, platforms, audience, language, creativity });
    const response = await callAI(provider, prompt, creativity);
    stopSpinner();
    aiResult = parseAIResponse(response.text);
    tokensUsed = response.tokens;

    // Fill missing keys
    const requiredKeys = ['headline', 'tagline', 'adCopy', 'callToAction', 'targetAudience', 'keyBenefits', 'platformVersions'];
    for (const key of requiredKeys) {
      if (!aiResult[key] || typeof aiResult[key] !== 'string') {
        aiResult[key] = `[Please regenerate — ${key} was missing]`;
      }
    }
    // posterPrompt is optional
    if (!aiResult.posterPrompt || typeof aiResult.posterPrompt !== 'string') {
      aiResult.posterPrompt = `Professional advertisement poster for "${productName}". Headline: "${aiResult.headline}". Style: modern, clean, eye-catching.`;
    }
  } catch (err) {
    stopSpinner();
    console.log(red(`\n  ✗ Generation failed: ${err.message}\n`));
    process.exit(1);
  }

  // Output
  if (outputFormat === 'json') {
    const json = JSON.stringify(aiResult, null, 2);
    console.log(json);
    if (saveFile) writeFileSync(saveFile, json);
  } else if (outputFormat === 'md') {
    const md = exportMarkdown(aiResult, productName, tone);
    console.log(md);
    if (saveFile) writeFileSync(saveFile, md);
  } else if (outputFormat === 'txt') {
    const txt = exportTxt(aiResult, productName);
    console.log(txt);
    if (saveFile) writeFileSync(saveFile, txt);
  } else {
    printCampaign(aiResult, productName, tone, provider, tokensUsed);
    if (saveFile) {
      const ext = saveFile.endsWith('.json') ? 'json' : saveFile.endsWith('.md') ? 'md' : 'txt';
      if (ext === 'json') writeFileSync(saveFile, JSON.stringify(aiResult, null, 2));
      else if (ext === 'md') writeFileSync(saveFile, exportMarkdown(aiResult, productName, tone));
      else writeFileSync(saveFile, exportTxt(aiResult, productName));
      console.log(green(`  ✓ Saved to ${saveFile}`));
    }
  }

  // Generate posters if requested
  if (poster) {
    console.log(`\n${purple(bold('  🎨 Generating Ad Posters...'))}\n`);
    try {
      const posterResults = await generatePosters({
        productName,
        productDesc: desc,
        headline: aiResult.headline,
        tagline: aiResult.tagline,
        callToAction: aiResult.callToAction,
        tone,
        platforms,
        posterPrompt: aiResult.posterPrompt,
        posterDir,
      });
      
      if (posterResults.length > 0) {
        console.log(`\n  ${green(bold('✅ ' + posterResults.length + ' Poster(s) Generated!'))}`);
        console.log(dim(`  Saved to: ${resolve(posterDir)}`));
      } else {
        console.log(red('\n  ✗ No posters were generated. Check errors above.'));
      }
    } catch (err) {
      console.log(red(`\n  ✗ Poster generation failed: ${err.message}`));
    }
  }
}

main().catch(err => {
  console.error(red(`\n  Fatal error: ${err.message}\n`));
  process.exit(1);
});
