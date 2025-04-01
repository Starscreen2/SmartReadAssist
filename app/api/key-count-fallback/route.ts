import { NextResponse } from "next/server"

export async function GET() {
  // This is a simplified fallback API that always returns valid JSON
  return NextResponse.json({
    count: 1,
    source: "fallback",
  })
}

