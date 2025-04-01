"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

export function ApiKeyDashboard() {
  const [keyCount, setKeyCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchKeyCount() {
      try {
        setIsLoading(true)
        const count = await fetch("/api/key-count").then((res) => res.json())
        setKeyCount(count.count)
      } catch (error) {
        console.error("Failed to fetch key count:", error)
        setKeyCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchKeyCount()

    // Refresh every 5 minutes
    const interval = setInterval(fetchKeyCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">API Key Management</CardTitle>
          {keyCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {keyCount} keys active
            </Badge>
          )}
        </div>
        <CardDescription>Load balancing across multiple Gemini API keys</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading key information...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Key Distribution</span>
                  <span className="text-xs text-muted-foreground">Round-robin rotation</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <p className="text-sm">
                {keyCount === 0 ? (
                  <span className="text-destructive">No API keys configured. Please add at least one key.</span>
                ) : keyCount === 1 ? (
                  <span>Using 1 Gemini API key for all requests.</span>
                ) : (
                  <span>Using {keyCount} Gemini API keys in rotation to distribute load evenly.</span>
                )}
              </p>

              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>• Keys are used in round-robin fashion</p>
                <p>• All AI features use the key rotation mechanism</p>
                <p>• Helps prevent rate limiting issues</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

