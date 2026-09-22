/**
 * AdForge — /api (API Index)
 *
 * Lists all available API endpoints.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      generate: "POST /api/generate",
      regenerate: "POST /api/regenerate",
      enhanceDescription: "POST /api/enhance-description",
      campaigns: "GET/POST /api/campaigns",
      campaign: "GET/PUT/DELETE /api/campaigns/[id]",
      campaignFavorite: "PUT /api/campaigns/[id]/favorite",
      campaignRate: "PUT /api/campaigns/[id]/rate",
      campaignDuplicate: "POST /api/campaigns/[id]/duplicate",
      campaignVersions: "GET/POST /api/campaigns/[id]/versions",
      brandKits: "GET/POST /api/brand-kits",
      brandKit: "GET/PUT/DELETE /api/brand-kits/[id]",
      templates: "GET/POST /api/templates",
      analytics: "GET /api/analytics",
    },
  });
}
