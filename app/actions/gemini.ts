"use server"

import { getNextApiKey } from "@/lib/api-key-manager"
import { incrementApiCounter } from "@/app/api/usage-stats/route"

export async function askGemini(prompt: string): Promise<string> {
  try {
    // Add these debug logs
    console.log("DEBUG - askGemini function:")
    console.log("Original prompt length:", prompt.length)

    // Check if the prompt is too long and truncate if necessary
    // Gemini has a limit of around 30k tokens, which is roughly 120k characters
    // We'll be conservative and limit to 100k characters
    const MAX_PROMPT_LENGTH = 100000
    const truncatedPrompt =
      prompt.length > MAX_PROMPT_LENGTH
        ? prompt.substring(0, MAX_PROMPT_LENGTH) + "... [truncated due to length]"
        : prompt

    // Add this debug log
    console.log("Truncated prompt length:", truncatedPrompt.length)
    console.log("Was prompt truncated:", prompt.length > MAX_PROMPT_LENGTH)

    // Get the next API key from our rotation
    const apiKey = await getNextApiKey()

    // Note: We don't need to modify this function to handle language
    // The language instruction is already included in the prompt by the calling components
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: truncatedPrompt }],
            },
          ],
        }),
      },
    )

    // Update the API call to handle errors with incrementApiCounter
    try {
      // Track API usage
      try {
        incrementApiCounter()
      } catch (counterError) {
        console.error("Error incrementing API counter:", counterError)
        // Continue even if counter fails
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return "Sorry, I encountered an error while processing your request."
    }

    const data = await response.json()

    // Extract the response text from the Gemini API response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      return data.candidates[0].content.parts[0].text || "No response text found"
    } else {
      return "Couldn't parse the response from Gemini API"
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return "Sorry, I encountered an error while processing your request."
  }
}

