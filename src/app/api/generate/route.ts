import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSchema } from '@/lib/validations';
import { API_CONFIGS, getApiKey, creativityToTemperature } from '@/lib/ai-providers';
import { buildPrompt } from '@/lib/prompt-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = generateSchema.parse(body);

    const apiKey = getApiKey(input.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${input.provider}` },
        { status: 400 }
      );
    }

    const config = API_CONFIGS[input.provider];
    const temperature = creativityToTemperature(input.creativity);

    const prompt = buildPrompt({
      productName: input.productName,
      productDesc: input.productDesc,
      tone: input.tone,
      audience: input.audience,
      platforms: input.platforms,
      brandVoice: input.brandVoice,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    });

    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const bodyObj = config.buildBody(prompt, temperature);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API returned ${response.status}`);
    }

    const data = await response.json();
    let raw = config.parseResponse(data);

    raw = raw.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON');
    }

    return NextResponse.json({
      result: {
        headline: result.headline || '',
        tagline: result.tagline || '',
        adCopy: result.adCopy || '',
        callToAction: result.callToAction || '',
        targetAudience: result.targetAudience || '',
        keyBenefits: result.keyBenefits || '',
        platformVersions: result.platformVersions || '',
      },
      provider: config.name,
      model: config.model,
    });
  } catch (error) {
    console.error('Generate error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}