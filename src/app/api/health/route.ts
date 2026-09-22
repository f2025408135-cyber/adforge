/**
 * AdForge — /api/health
 *
 * Simple health check endpoint.
 */

import { NextResponse } from "next/server";
import { isDbAvailable } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: isDbAvailable() ? "connected" : "unavailable (serverless)",
  });
}
