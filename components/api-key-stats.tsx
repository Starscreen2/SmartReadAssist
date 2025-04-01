"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ApiKeyStats() {
  const [keyCount, setKeyCount] = useState(0)

  useEffect(() => {
    // This is a client component, but we need to call a server function
    // We'll use a simple approach to get the key count
    async function fetchKeyCount() {
      try {
        const count = await fetch("/api/key-count").then((res) => res.json())
        setKeyCount(count.count)
      } catch (error) {
        console.error("Failed to fetch key count:", error)
        setKeyCount(0)
      }
    }

    fetchKeyCount()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
        <CardDescription>Load balancing across multiple Gemini API keys</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Currently using {keyCount} Gemini API keys in rotation.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Keys are used in round-robin fashion to distribute load evenly.
        </p>
      </CardContent>
    </Card>
  )
}

