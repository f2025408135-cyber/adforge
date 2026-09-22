/**
 * AdForge — /api/generate-poster (AI Poster Image Generation)
 *
 * POST endpoint that generates ad poster images using z-ai-web-dev-sdk.
 * Creates visual ad creatives for different platform sizes.
 */

import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Lazy-initialize the Z-AI SDK instance
let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

// Platform-specific image sizes
const POSTER_SIZES: Record<string, { width: number; height: number; label: string; zaiSize: string }> = {
  instagram: { width: 1080, height: 1080, label: "Instagram Post", zaiSize: "1024x1024" },
  "instagram-story": { width: 1080, height: 1920, label: "Instagram Story", zaiSize: "768x1344" },
  facebook: { width: 1200, height: 630, label: "Facebook Ad", zaiSize: "1344x768" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn Post", zaiSize: "1344x768" },
  twitter: { width: 1200, height: 675, label: "Twitter/X Post", zaiSize: "1344x768" },
  billboard: { width: 1440, height: 720, label: "Billboard", zaiSize: "1440x720" },
  youtube: { width: 1280, height: 720, label: "YouTube Thumbnail", zaiSize: "1344x768" },
  general: { width: 1024, height: 1024, label: "General Ad", zaiSize: "1024x1024" },
};

// Style presets for poster generation
const STYLE_PRESETS: Record<string, string> = {
  professional: "clean, modern, corporate professional design, minimalist layout, premium quality, sharp typography",
  luxury: "ultra-luxurious, high-end fashion editorial style, gold accents, elegant serif typography, premium materials feel",
  casual: "warm, friendly, approachable design, soft colors, hand-drawn elements, fun layout",
  urgent: "bold, high-contrast, attention-grabbing design, red accents, large impact typography, urgency visual cues",
  humorous: "playful, witty design, bright colors, unexpected visual elements, fun layout",
  inspirational: "inspiring, aspirational design, dramatic lighting, cinematic feel, emotional imagery",
  playful: "vibrant, energetic design, bold colors, dynamic shapes, fun and lively layout",
  minimalist: "ultra-clean minimalist design, lots of white space, single focal point, refined typography",
  bold: "striking, provocative design, high contrast, oversized typography, powerful imagery",
  empathetic: "warm, caring design, soft tones, human connection imagery, gentle layout",
  technical: "sleek, futuristic tech design, data visualization elements, precise grid layout, blue tones",
  storytelling: "narrative design, cinematic composition, sequential visual flow, story-driven imagery",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productName,
      headline,
      tagline,
      callToAction,
      tone,
      platforms,
      productDesc,
      posterStyle,
    } = body;

    if (!productName || !headline) {
      return NextResponse.json(
        { error: "Product name and headline are required for poster generation" },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    // Determine which platforms to generate posters for
    const targetPlatforms = platforms?.length > 0
      ? platforms.filter((p: string) => POSTER_SIZES[p])
      : ["instagram", "facebook"];

    // Limit to max 3 posters at once to avoid timeout
    const platformsToGenerate = targetPlatforms.slice(0, 3);

    const toneStyle = STYLE_PRESETS[tone] || STYLE_PRESETS.professional;
    const customStyle = posterStyle ? `, ${posterStyle}` : "";

    // Build poster prompt
    const buildPosterPrompt = (platform: string) => {
      const sizeInfo = POSTER_SIZES[platform];
      const ctaText = callToAction ? ` with call-to-action "${callToAction}"` : "";
      const taglineText = tagline ? ` and tagline "${tagline}"` : "";

      return `Professional advertisement poster for "${productName}". ${productDesc ? `Product: ${productDesc}. ` : ""}Headline: "${headline}"${taglineText}${ctaText}. Style: ${toneStyle}${customStyle}. Design: No real photos of people, use illustrations or abstract visuals instead. Professional graphic design, ready-to-publish ad creative. High quality, commercial grade.`;
    };

    // Generate posters in parallel
    const results = await Promise.allSettled(
      platformsToGenerate.map(async (platform: string) => {
        const sizeInfo = POSTER_SIZES[platform];
        const prompt = buildPosterPrompt(platform);

        const response = await zai.images.generations.create({
          prompt,
          size: sizeInfo.zaiSize as any,
        });

        const imageBase64 = response.data?.[0]?.base64;
        if (!imageBase64) {
          throw new Error(`No image data returned for ${platform}`);
        }

        return {
          platform,
          label: sizeInfo.label,
          size: `${sizeInfo.width}x${sizeInfo.height}`,
          imageBase64,
          mimeType: "image/png",
        };
      })
    );

    // Collect successful results and errors
    const posters: any[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        posters.push(result.value);
      } else {
        errors.push(`${platformsToGenerate[i]}: ${result.reason?.message || "Failed"}`);
      }
    });

    if (posters.length === 0) {
      return NextResponse.json(
        { error: `Failed to generate any posters: ${errors.join("; ")}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      posters,
      errors: errors.length > 0 ? errors : undefined,
      provider: "adforge-image",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong generating posters.";
    console.error("Poster generation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
