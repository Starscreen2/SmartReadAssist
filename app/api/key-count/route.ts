import { NextResponse } from "next/server"
import { getKeyCount } from "@/lib/api-key-manager"

export async function GET() {
  try {
    // Get the key count asynchronously
    const count = await getKeyCount()

    // Explicitly set the content type to application/json
    return new NextResponse(JSON.stringify({ count }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error getting key count:", error)
    return new NextResponse(JSON.stringify({ count: 0, error: "Failed to get key count" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

