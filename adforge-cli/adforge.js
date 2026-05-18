#!/usr/bin/env node

/**
 * AdForge CLI — AI-Powered Ad Campaign Generator
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
 *   --provider <name>    AI provider: deepseek, gemini, glm (default: deepseek)
 *   --output <format>    Output format: terminal, json, md, txt (default: terminal)
 *   --save <filename>    Save output to file
 *   --enhance            Enhance the product description with AI first
 * 
 * Examples:
 *   node adforge.js "Nike Air Max" "Revolutionary running shoe"
 *   node adforge.js "My SaaS" "Project management tool" --tone bold --platforms linkedin,twitter
 *   node adforge.js "Coffee Shop" "Artisan coffee" --tone casual --enhance --save campaign.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-53387238d28b4746abb40dff4b291c9d';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
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
};

function bold(text) { return `${c.bold}${text}${c.reset}`; }
function dim(text) { return `${c.dim}${text}${c.reset}`; }
function green(text) { return `${c.green}${text}${c.reset}`; }
function red(text) { return `${c.red}${text}${c.reset}`; }
function orange(text) { return `${c.orange}${text}${c.reset}`; }
function terra(text) { return `${c.terra}${text}${c.reset}`; }
function cyan(text) { return `${c.cyan}${text}${c.reset}`; }

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(120000),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

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

async function callAI(provider, prompt, creativity) {
  const temperature = creativity <= 33 ? 0.3 : creativity <= 66 ? 0.7 : 1.0;

  switch (provider) {
    case 'gemini':
      if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set. Use --provider deepseek or set the env var.');
      return callGemini(prompt, temperature);
    case 'glm':
      if (!GLM_API_KEY) throw new Error('GLM_API_KEY not set. Use --provider deepseek or set the env var.');
      return callGLM(prompt, temperature);
    case 'deepseek':
    default:
      if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not set.');
      return callDeepSeek(prompt, temperature);
  }
}

// ─── Prompt Builder ──────────────────────────────────────────────────

function buildPrompt({ productName, productDesc, tone, platforms, audience, language, creativity }) {
  return `You are an expert advertising copywriter. Generate a complete, ready-to-publish ad campaign.

PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${tone}
TARGET PLATFORMS: ${platforms.join(', ')}
${audience ? `TARGET AUDIENCE: ${audience}` : ''}
LANGUAGE: ${language}
CREATIVITY: ${creativity <= 33 ? 'Conservative & safe' : creativity <= 66 ? 'Balanced & professional' : 'Highly creative & bold'}

Return a JSON object with EXACTLY these keys:
{
  "headline": "A powerful, attention-grabbing headline (under 12 words)",
  "tagline": "A memorable tagline (under 8 words)",
  "adCopy": "Full advertisement copy body (100-150 words, persuasive, on-tone)",
  "callToAction": "A strong call-to-action phrase (under 6 words)",
  "targetAudience": "Detailed target audience description (50-80 words)",
  "keyBenefits": "3-5 key benefits as bullet points (60-80 words total)",
  "platformVersions": "Platform-specific adaptations — write a brief strategy for EACH platform listed above (100-150 words)"
}

RULES:
- Be specific and creative — no generic filler
- Match the ${tone} tone perfectly
- Make the headline and CTA irresistible
- Tailor platform versions to each platform's strengths
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
${dim('  AI-Powered Ad Campaign Generator — DeepSeek V4 Flash')}
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

  const saveFile = (await askQuestion(rl, `  ${bold('Save to file?')} ${dim('(filename or leave empty)')}: `)).trim() || '';

  rl.close();

  return { productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider: 'deepseek', saveFile };
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
    console.log(`    --provider <name>    AI provider: deepseek, gemini, glm (default: deepseek)`);
    console.log(`    --output <format>    Output: terminal, json, md, txt (default: terminal)`);
    console.log(`    --save <filename>    Save output to file`);
    console.log(`    --enhance            Enhance description with AI first`);
    console.log(`    --interactive, -i    Run in interactive mode`);
    console.log(`    --help, -h           Show this help\n`);
    console.log(bold('  Tones:'));
    console.log(`    ${TONES.join(', ')}\n`);
    console.log(bold('  Platforms:'));
    console.log(`    ${PLATFORMS.join(', ')}\n`);
    console.log(bold('  Examples:'));
    console.log(`    node adforge.js "Nike Air Max" "Revolutionary running shoe"`);
    console.log(`    node adforge.js "My SaaS" "Project management" --tone bold --platforms linkedin,twitter`);
    console.log(`    node adforge.js "Coffee Shop" "Artisan coffee" --enhance --save campaign.md\n`);
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
  const provider = flags.provider || 'deepseek';
  const outputFormat = flags.output || 'terminal';
  const saveFile = flags.save || '';
  const enhance = flags.enhance || false;

  printBanner();
  await runCampaign({ productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider, outputFormat, saveFile });
}

async function runCampaign({ productName, productDesc, enhance, tone, platforms, audience, creativity, language, provider = 'deepseek', outputFormat = 'terminal', saveFile = '' }) {
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
}

main().catch(err => {
  console.error(red(`\n  Fatal error: ${err.message}\n`));
  process.exit(1);
});
