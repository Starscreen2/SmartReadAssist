import { NextResponse } from "next/server"

// Simple in-memory counter
let totalRequests = 0
let todayRequests = 0
let lastResetDay = new Date().getDate()

export function incrementApiCounter() {
  const today = new Date().getDate()
  if (today !== lastResetDay) {
    todayRequests = 0
    lastResetDay = today
  }

  totalRequests++
  todayRequests++
}

// Make sure this is exported as a named function
export async function GET() {
  // Explicitly set the content type to application/json
  return new NextResponse(
    JSON.stringify({
      totalRequests,
      todayRequests,
      lastResetDay,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

