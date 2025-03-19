"use server"

export async function askGemini(prompt: string): Promise<string> {
  try {
    // Check if the prompt is too long and truncate if necessary
    // Gemini has a limit of around 30k tokens, which is roughly 120k characters
    // We'll be conservative and limit to 100k characters
    const MAX_PROMPT_LENGTH = 100000
    const truncatedPrompt =
      prompt.length > MAX_PROMPT_LENGTH
        ? prompt.substring(0, MAX_PROMPT_LENGTH) + "... [truncated due to length]"
        : prompt

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY || "",
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

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
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

