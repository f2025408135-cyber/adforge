/**
 * AdForge — /api/providers
 *
 * GET — Returns the list of available AI providers and their status.
 * This allows the frontend to show which providers have API keys
 * configured on the server (no keys are ever exposed).
 */

import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/ai-providers";

export async function GET() {
  const providers = getAvailableProviders();
  return NextResponse.json({
    providers,
    defaultProvider: "deepseek", // DeepSeek V4 Flash is always available
  });
}
