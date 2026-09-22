#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║                  AdForge CLI Agent                       ║
 * ║     AI-Powered Ad Campaign Generator for Your Terminal   ║
 * ║                                                          ║
 * ║  Usage:  node cli/index.js                               ║
 * ║  Or:     npm run adforge                                 ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * No web hosting. No database. No deployment headaches.
 * Just you, your terminal, and DeepSeek AI.
 */

import { input, select, confirm, checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import {
  generateCampaign,
  regenerateSection,
  enhanceDescription,
  getAvailableProviders,
  TONE_MAP,
} from "./ai.js";
import {
  saveCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  exportMarkdown,
  exportText,
  saveExport,
} from "./storage.js";

// ── Load Environment ─────────────────────────────────────────────

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

// ── Display Helpers ──────────────────────────────────────────────

function banner() {
  console.log(`
${chalk.cyan.bold("  ╔══════════════════════════════════════════╗")}
${chalk.cyan.bold("  ║")}  ${chalk.yellow.bold("AdForge CLI")} ${chalk.gray("— AI Ad Campaign Agent")}  ${chalk.cyan.bold("║")}
${chalk.cyan.bold("  ║")}  ${chalk.gray("Generate professional ad campaigns")}    ${chalk.cyan.bold("║")}
${chalk.cyan.bold("  ║")}  ${chalk.gray("right from your terminal")}             ${chalk.cyan.bold("║")}
${chalk.cyan.bold("  ╚══════════════════════════════════════════╝")}
`);
}

function displayCampaign(campaign, meta = {}) {
  const g = campaign.generation || campaign;
  const productName = campaign.productName || meta.productName || "Campaign";

  console.log("");
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan.bold(`  📣 ${productName}`));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("");

  console.log(chalk.white.bold("  HEADLINE: "), chalk.yellow(g.headline || "—"));
  console.log(chalk.white.bold("  TAGLINE:  "), chalk.italic.green(g.tagline || "—"));
  console.log("");

  console.log(chalk.white.bold("  AD COPY:"));
  console.log(chalk.gray("  ─────────"));
  console.log(chalk.white("  " + (g.adCopy || "—").replace(/\n/g, "\n  ")));
  console.log("");

  console.log(chalk.white.bold("  CTA:      "), chalk.bold.magenta(g.callToAction || "—"));
  console.log(chalk.white.bold("  AUDIENCE: "), chalk.white(g.targetAudience || "—"));
  console.log("");

  // Key benefits
  if (g.keyBenefits) {
    console.log(chalk.white.bold("  KEY BENEFITS:"));
    const benefits = String(g.keyBenefits).split("|");
    benefits.forEach((b, i) => {
      console.log(chalk.green(`    ${i + 1}. ${b.trim()}`));
    });
    console.log("");
  }

  // Platform versions
  if (g.platformVersions) {
    console.log(chalk.white.bold("  PLATFORM VERSIONS:"));
    try {
      const pv = typeof g.platformVersions === "string" ? JSON.parse(g.platformVersions) : g.platformVersions;
      for (const [platform, content] of Object.entries(pv)) {
        const label = platform.charAt(0).toUpperCase() + platform.slice(1);
        console.log(chalk.blue(`    📱 ${label}:`));
        if (typeof content === "object") {
          for (const [key, val] of Object.entries(content)) {
            console.log(chalk.gray(`       ${key}: `) + chalk.white(String(val)));
          }
        } else {
          console.log(chalk.white("       " + String(content)));
        }
      }
    } catch {
      console.log(chalk.white("    " + String(g.platformVersions).substring(0, 200)));
    }
    console.log("");
  }

  // Meta info
  if (meta.elapsed || meta.cost) {
    console.log(chalk.gray("  ──────────────────────────────────────────────"));
    const parts = [];
    if (meta.elapsed) parts.push(`⏱ ${Math.round(meta.elapsed / 1000)}s`);
    if (meta.tokens?.total) parts.push(`📊 ${meta.tokens.total} tokens`);
    if (meta.cost) parts.push(`💰 $${meta.cost.toFixed(6)}`);
    console.log(chalk.gray("  " + parts.join("  |  ")));
  }

  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("");
}

function displayCampaignShort(c) {
  const g = c.generation || {};
  const date = new Date(c.createdAt).toLocaleDateString();
  const star = c.favorite ? chalk.yellow("★") : " ";
  const rating = c.rating ? chalk.yellow("●".repeat(c.rating)) + chalk.gray("●".repeat(5 - c.rating)) : "";
  console.log(`  ${star} ${chalk.cyan(c.id.slice(0, 15))}  ${chalk.white.bold((c.productName || "Untitled").padEnd(25))}  ${chalk.gray(date)}  ${chalk.gray((c.tone || "").padEnd(15))}  ${rating}`);
}

// ── Main Menu ────────────────────────────────────────────────────

async function mainMenu() {
  return select({
    message: chalk.bold("What would you like to do?"),
    choices: [
      { value: "generate", name: "🚀 Generate New Campaign", description: "Create a full ad campaign with AI" },
      { value: "history", name: "📋 View Saved Campaigns", description: "Browse & manage your campaigns" },
      { value: "enhance", name: "✨ Enhance Description", description: "Make a product description more compelling" },
      { value: "quit", name: "👋 Quit", description: "Exit AdForge CLI" },
    ],
  });
}

// ── Generate Campaign Flow ───────────────────────────────────────

async function generateFlow() {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    console.log(chalk.red("\n  ⚠ No AI providers configured!"));
    console.log(chalk.gray("  Set DEEPSEEK_API_KEY in .env.local or as environment variable.\n"));
    return;
  }

  // Provider selection
  let provider;
  if (providers.length === 1) {
    provider = providers[0].id;
    console.log(chalk.gray(`\n  Using ${providers[0].name} (only available provider)\n`));
  } else {
    provider = await select({
      message: "Select AI provider:",
      choices: providers.map(p => ({
        value: p.id,
        name: p.name,
      })),
    });
  }

  // Product details
  const productName = await input({
    message: "Product/Brand name:",
    validate: v => v.trim().length > 0 || "Product name is required",
  });

  let productDesc = await input({
    message: "Product description (min 10 chars):",
    validate: v => v.trim().length >= 10 || "Description must be at least 10 characters",
  });

  // Offer to enhance
  const wantEnhance = await confirm({
    message: "Want AI to enhance your description first?",
    default: false,
  });

  if (wantEnhance) {
    const spinner = ora("Enhancing description...").start();
    try {
      const result = await enhanceDescription({ productName, productDesc, provider });
      spinner.succeed("Description enhanced!");
      console.log(chalk.gray("  Original: ") + chalk.gray(productDesc));
      console.log(chalk.gray("  Enhanced: ") + chalk.green(result.enhanced));
      const useEnhanced = await confirm({
        message: "Use enhanced description?",
        default: true,
      });
      if (useEnhanced) productDesc = result.enhanced;
    } catch (err) {
      spinner.fail("Enhancement failed: " + err.message);
    }
  }

  // Tone
  const tone = await select({
    message: "Select tone:",
    choices: Object.entries(TONE_MAP).map(([key, desc]) => ({
      value: key,
      name: `${key.charAt(0).toUpperCase() + key.slice(1)} — ${desc}`,
    })),
  });

  // Platforms
  const platforms = await checkbox({
    message: "Select target platforms:",
    choices: [
      "Facebook", "Instagram", "Twitter/X", "LinkedIn", "TikTok",
      "YouTube", "Google Ads", "Pinterest", "Email", "WhatsApp",
    ].map(p => ({ value: p.toLowerCase().replace(/[/.]/g, ""), name: p })),
    validate: v => v.length > 0 || "Select at least one platform",
  });

  // Audience (optional)
  const hasAudience = await confirm({
    message: "Specify target audience?",
    default: false,
  });
  const audience = hasAudience
    ? await input({ message: "Target audience:" })
    : undefined;

  // Creativity
  const creativityLevel = await select({
    message: "Creativity level:",
    choices: [
      { value: 20, name: "🧊 Conservative — safe, predictable copy" },
      { value: 50, name: "⚖️ Balanced — creative but on-brand" },
      { value: 80, name: "🔥 Creative — bold, unexpected angles" },
    ],
  });

  // Additional instructions (optional)
  const hasInstructions = await confirm({
    message: "Add custom instructions?",
    default: false,
  });
  const additionalInstructions = hasInstructions
    ? await input({ message: "Instructions (e.g., 'Focus on sustainability'):" })
    : undefined;

  // ── Generate! ──────────────────────────────────────────────────
  const spinner = ora("Generating your campaign... (DeepSeek V4 Flash reasoning may take 10-20s)").start();

  let campaignData;
  let meta;

  try {
    const result = await generateCampaign({
      provider,
      productName,
      productDesc,
      tone,
      platforms,
      audience,
      creativity: creativityLevel,
      additionalInstructions,
    });
    campaignData = result.campaign;
    meta = result.meta;
    spinner.succeed("Campaign generated!");
  } catch (err) {
    spinner.fail("Generation failed: " + err.message);
    return;
  }

  // Add productName to campaign for display
  campaignData.productName = productName;

  // Display the campaign
  displayCampaign(campaignData, meta);

  // ── Post-generation actions ────────────────────────────────────
  let currentCampaign = campaignData;
  let currentMeta = meta;

  while (true) {
    const action = await select({
      message: "What next?",
      choices: [
        { value: "save", name: "💾 Save Campaign", description: "Save to local file" },
        { value: "regenerate", name: "🔄 Regenerate Section", description: "Re-do a specific section" },
        { value: "export", name: "📤 Export", description: "Export as Markdown, TXT, or JSON" },
        { value: "copy", name: "📋 Copy to Clipboard", description: "Copy campaign text" },
        { value: "new", name: "🚀 New Campaign", description: "Start fresh" },
        { value: "back", name: "↩️ Back to Menu", description: "Return to main menu" },
      ],
    });

    if (action === "save") {
      const saved = saveCampaign(currentCampaign, {
        provider,
        tone,
        platforms,
        tokensUsed: currentMeta.tokens?.total || 0,
        cost: currentMeta.cost || 0,
      });
      console.log(chalk.green(`\n  ✅ Saved! ID: ${saved.id}`));
      console.log(chalk.gray(`  File: ${saved.filename}\n`));
    }

    else if (action === "regenerate") {
      const sectionKey = await select({
        message: "Which section to regenerate?",
        choices: [
          { value: "headline", name: "Headline" },
          { value: "tagline", name: "Tagline" },
          { value: "adCopy", name: "Ad Copy" },
          { value: "callToAction", name: "Call to Action" },
          { value: "targetAudience", name: "Target Audience" },
          { value: "keyBenefits", name: "Key Benefits" },
          { value: "platformVersions", name: "Platform Versions" },
        ],
      });

      const regSpinner = ora(`Regenerating ${sectionKey}...`).start();
      try {
        const regResult = await regenerateSection({
          provider,
          sectionKey,
          productName,
          productDesc,
          tone,
          platforms,
          currentContent: String(currentCampaign[sectionKey] || ""),
          creativity: creativityLevel,
        });

        // Update the section
        const sectionData = regResult.section;
        if (sectionData[sectionKey] !== undefined) {
          currentCampaign[sectionKey] = sectionData[sectionKey];
        }

        regSpinner.succeed(`${sectionKey} regenerated!`);
        displayCampaign(currentCampaign, regResult.meta);
        currentMeta = regResult.meta;
      } catch (err) {
        regSpinner.fail("Regeneration failed: " + err.message);
      }
    }

    else if (action === "export") {
      const format = await select({
        message: "Export format:",
        choices: [
          { value: "md", name: "Markdown (.md)" },
          { value: "txt", name: "Plain Text (.txt)" },
          { value: "json", name: "JSON (.json)" },
        ],
      });

      let content, filename;
      const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      const ts = Date.now();

      if (format === "md") {
        content = exportMarkdown({ ...currentCampaign, productName, provider, tone, tokensUsed: currentMeta.tokens?.total });
        filename = `${slug}_${ts}.md`;
      } else if (format === "txt") {
        content = exportText({ ...currentCampaign, productName, provider, tone });
        filename = `${slug}_${ts}.txt`;
      } else {
        content = JSON.stringify({ productName, provider, tone, platforms, generation: currentCampaign, meta: currentMeta }, null, 2);
        filename = `${slug}_${ts}.json`;
      }

      const filepath = saveExport(content, filename);
      console.log(chalk.green(`\n  ✅ Exported to: ${filepath}\n`));
    }

    else if (action === "copy") {
      const text = exportText({ ...currentCampaign, productName });
      try {
        const { execSync } = await import("child_process");
        // Try xclip (Linux), pbcopy (Mac), or clip (Windows)
        if (process.platform === "darwin") {
          execSync("pbcopy", { input: text });
        } else if (process.platform === "win32") {
          execSync("clip", { input: text });
        } else {
          execSync("xclip -selection clipboard", { input: text });
        }
        console.log(chalk.green("\n  ✅ Copied to clipboard!\n"));
      } catch {
        console.log(chalk.yellow("\n  ⚠ Clipboard not available. Export to file instead.\n"));
      }
    }

    else if (action === "new") {
      return generateFlow();
    }

    else {
      return;
    }
  }
}

// ── Campaign History Flow ────────────────────────────────────────

async function historyFlow() {
  const campaigns = listCampaigns();

  if (campaigns.length === 0) {
    console.log(chalk.yellow("\n  No saved campaigns yet. Generate one first!\n"));
    return;
  }

  console.log(chalk.cyan.bold(`\n  📋 ${campaigns.length} Saved Campaigns`));
  console.log(chalk.gray("  ──────────────────────────────────────────────────────"));
  console.log(chalk.gray("     ID                 Name                      Date         Tone              Rating"));
  console.log(chalk.gray("  ──────────────────────────────────────────────────────"));

  campaigns.forEach(displayCampaignShort);

  console.log(chalk.gray("  ──────────────────────────────────────────────────────\n"));

  const action = await select({
    message: "Campaign actions:",
    choices: [
      { value: "view", name: "👁 View Campaign", description: "See full campaign details" },
      { value: "export", name: "📤 Export Campaign", description: "Export to file" },
      { value: "rate", name: "⭐ Rate Campaign", description: "Give 1-5 star rating" },
      { value: "fav", name: "★ Toggle Favorite", description: "Mark/unmark as favorite" },
      { value: "delete", name: "🗑 Delete Campaign", description: "Remove from saved" },
      { value: "back", name: "↩️ Back", description: "Return to main menu" },
    ],
  });

  if (action === "back") return;

  // Select campaign
  const selected = await select({
    message: "Select campaign:",
    choices: campaigns.map(c => ({
      value: c.id,
      name: `${c.favorite ? "★ " : "  "}${c.productName} — ${c.tone} — ${new Date(c.createdAt).toLocaleDateString()}`,
    })),
  });

  const campaign = getCampaign(selected);
  if (!campaign) {
    console.log(chalk.red("  Campaign not found."));
    return;
  }

  if (action === "view") {
    displayCampaign(campaign, { elapsed: 0 });
  }

  else if (action === "export") {
    const format = await select({
      message: "Export format:",
      choices: [
        { value: "md", name: "Markdown (.md)" },
        { value: "txt", name: "Plain Text (.txt)" },
        { value: "json", name: "JSON (.json)" },
      ],
    });

    let content, filename;
    const slug = (campaign.productName || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    if (format === "md") {
      content = exportMarkdown(campaign);
      filename = `${slug}.md`;
    } else if (format === "txt") {
      content = exportText(campaign);
      filename = `${slug}.txt`;
    } else {
      content = JSON.stringify(campaign, null, 2);
      filename = `${slug}.json`;
    }

    const filepath = saveExport(content, filename);
    console.log(chalk.green(`\n  ✅ Exported to: ${filepath}\n`));
  }

  else if (action === "rate") {
    const rating = await select({
      message: "Rate this campaign:",
      choices: [1, 2, 3, 4, 5].map(n => ({
        value: n,
        name: "●".repeat(n) + "○".repeat(5 - n) + ` ${n}/5`,
      })),
    });
    updateCampaign(selected, { rating });
    console.log(chalk.green(`\n  ✅ Rated ${"●".repeat(rating)}○${"○".repeat(5 - rating)}\n`));
  }

  else if (action === "fav") {
    const newFav = !campaign.favorite;
    updateCampaign(selected, { favorite: newFav });
    console.log(chalk.green(`\n  ${newFav ? "★ Marked as favorite" : "☆ Removed from favorites"}\n`));
  }

  else if (action === "delete") {
    const sure = await confirm({
      message: `Delete "${campaign.productName}"?`,
      default: false,
    });
    if (sure) {
      deleteCampaign(selected);
      console.log(chalk.red(`\n  🗑 Deleted.\n`));
    }
  }
}

// ── Enhance Description Flow ─────────────────────────────────────

async function enhanceFlow() {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    console.log(chalk.red("\n  ⚠ No AI providers configured!\n"));
    return;
  }

  const provider = providers.length === 1
    ? providers[0].id
    : await select({
        message: "Select AI provider:",
        choices: providers.map(p => ({ value: p.id, name: p.name })),
      });

  const productName = await input({
    message: "Product name:",
    validate: v => v.trim().length > 0 || "Required",
  });

  const productDesc = await input({
    message: "Current description:",
    validate: v => v.trim().length >= 10 || "At least 10 characters",
  });

  const spinner = ora("Enhancing description...").start();
  try {
    const result = await enhanceDescription({ productName, productDesc, provider });
    spinner.succeed("Enhanced!");
    console.log("");
    console.log(chalk.gray("  Original:  ") + chalk.gray(productDesc));
    console.log(chalk.green("  Enhanced:  ") + chalk.green.bold(result.enhanced));
    console.log(chalk.gray(`  (${result.meta.tokens.total} tokens, ${Math.round(result.meta.elapsed / 1000)}s, $${result.meta.cost.toFixed(6)})`));
    console.log("");
  } catch (err) {
    spinner.fail("Enhancement failed: " + err.message);
  }
}

// ── Main Loop ────────────────────────────────────────────────────

async function main() {
  banner();

  // Check for API keys
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    console.log(chalk.red.bold("  ⚠  No AI API keys found!"));
    console.log(chalk.gray("  Set one of these environment variables:"));
    console.log(chalk.gray("    DEEPSEEK_API_KEY=sk-xxx"));
    console.log(chalk.gray("    GEMINI_API_KEY=xxx"));
    console.log(chalk.gray("    GLM_API_KEY=xxx"));
    console.log(chalk.gray("\n  Or create a .env.local file in the project root.\n"));
    process.exit(1);
  }

  console.log(chalk.gray(`  Available: ${providers.map(p => p.name).join(", ")}\n`));

  while (true) {
    try {
      const choice = await mainMenu();

      if (choice === "generate") {
        await generateFlow();
      } else if (choice === "history") {
        await historyFlow();
      } else if (choice === "enhance") {
        await enhanceFlow();
      } else if (choice === "quit") {
        console.log(chalk.cyan("\n  👋 Bye! Happy advertising!\n"));
        process.exit(0);
      }
    } catch (err) {
      // User pressed Ctrl+C or there was an error
      if (err.name === "ExitPromptError" || err.message?.includes("User force closed")) {
        console.log(chalk.cyan("\n  👋 Bye!\n"));
        process.exit(0);
      }
      console.log(chalk.red(`\n  Error: ${err.message}\n`));
    }
  }
}

main();
