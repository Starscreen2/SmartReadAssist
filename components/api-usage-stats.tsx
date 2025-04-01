"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ApiUsageStats() {
  const [apiStats, setApiStats] = useState({
    totalRequests: 0,
    todayRequests: 0,
    lastResetDay: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSimulated, setIsSimulated] = useState(false)

  // Create a mock data function to use when the API is not available
  const getMockData = () => {
    return {
      totalRequests: Math.floor(Math.random() * 100) + 50,
      todayRequests: Math.floor(Math.random() * 20) + 5,
      lastResetDay: new Date().getDate(),
    }
  }

  const fetchApiStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsSimulated(false)

      // Always use simulated data for now since the API is not working
      const mockData = getMockData()
      setApiStats(mockData)
      setIsSimulated(true)
    } catch (error) {
      console.error("Error in fetchApiStats:", error)
      setError("Failed to load API usage statistics")

      // Use mock data as last resort
      const mockData = getMockData()
      setApiStats(mockData)
      setIsSimulated(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApiStats()

    // Refresh every 5 minutes
    const interval = setInterval(fetchApiStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate percentage of daily limit (assuming a limit of 100 requests per day)
  const dailyLimit = 100
  const usagePercentage = Math.min(100, Math.round((apiStats.todayRequests / dailyLimit) * 100))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">API Usage Statistics</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchApiStats} disabled={isLoading} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Gemini API request tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isSimulated && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-md p-2 text-xs flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <p>API stats unavailable. Showing simulated data.</p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Today's Usage</span>
                <span className="text-xs text-muted-foreground">
                  {apiStats.todayRequests} / {dailyLimit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Today</div>
                <div className="text-2xl font-semibold">{apiStats.todayRequests}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-2xl font-semibold">{apiStats.totalRequests}</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Daily counter resets at midnight</p>
              <p>• All AI features use the API counter</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

