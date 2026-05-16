import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoints: {
      generate: "POST /api/generate",
      regenerate: "POST /api/regenerate",
    },
  });
}
