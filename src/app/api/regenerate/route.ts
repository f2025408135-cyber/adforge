import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { regenerateSchema } from '@/lib/validations';
import { API_CONFIGS, getApiKey, TONE_MAP } from '@/lib/ai-providers';
import { SECTION_PROMPTS } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = regenerateSchema.parse(body);

    const apiKey = getApiKey(input.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${input.provider}` },
        { status: 400 }
      );
    }

    const config = API_CONFIGS[input.provider];
    const toneStr = TONE_MAP[input.tone] || 'professional';
    const promptFn = SECTION_PROMPTS[input.sectionKey];

    if (!promptFn) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    const prompt = promptFn(
      input.productName,
      input.productDesc,
      toneStr,
      input.platforms.join(', ')
    );

    const url = config.getUrl(apiKey);
    const headers = config.getHeaders(apiKey);
    const bodyObj = config.buildBody(prompt, 0.7);

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
    let text = config.parseResponse(data);
    text = text.replace(/```json|```/g, '').trim();

    return NextResponse.json({ text, sectionKey: input.sectionKey });
  } catch (error) {
    console.error('Regenerate error:', error);
    const message = error instanceof Error ? error.message : 'Regeneration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}