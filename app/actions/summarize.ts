"use server"

export async function summarizeText(
  text: string,
  title: string,
  length: "brief" | "medium" | "detailed" = "medium",
): Promise<string> {
  try {
    // Define length parameters
    const wordCounts = {
      brief: "100-150",
      medium: "200-300",
      detailed: "400-600",
    }

    // Create the prompt for the Gemini API
    const prompt = `You are a document summarization assistant. Create a concise summary of the following document that captures the main points, key arguments, and conclusions. The summary should be approximately ${wordCounts[length]} words.

Document Title: ${title}
Document Content: ${text}

Format the summary with clear sections, bullet points for key takeaways, and maintain the original document's main structure.`

    // Call the Gemini API
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
              parts: [{ text: prompt }],
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
      return data.candidates[0].content.parts[0].text || "No summary could be generated."
    } else {
      return "Couldn't parse the response from Gemini API"
    }
  } catch (error) {
    console.error("Error calling Gemini API for summarization:", error)
    return "Sorry, I encountered an error while generating the summary."
  }
}

export async function summarizeSection(text: string, context: string, title: string): Promise<string> {
  try {
    // Create the prompt for the Gemini API with emphasis on clarity and conciseness
    const prompt = `You are a document summarization assistant. Create an extremely concise and clear explanation of the following section from a document. Focus only on the provided section, but use the context to ensure accuracy.

Document Title: ${title}
Document Context: ${context.substring(0, 500)}... (abbreviated)
Section to Summarize: ${text}

Provide a crystal-clear explanation in 2-3 short sentences maximum. Use simple language that anyone can understand immediately. Focus only on the most important point or meaning. Avoid unnecessary details, jargon, or complexity.`

    // Call the Gemini API
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
              parts: [{ text: prompt }],
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
      return data.candidates[0].content.parts[0].text || "No summary could be generated."
    } else {
      return "Couldn't parse the response from Gemini API"
    }
  } catch (error) {
    console.error("Error calling Gemini API for section summarization:", error)
    return "Sorry, I encountered an error while generating the section summary."
  }
}

// New function to handle long document summarization
export async function summarizeLongDocument(
  text: string,
  title: string,
  length: "brief" | "medium" | "detailed" = "medium",
  onProgress?: (progress: number, stage: string) => void,
): Promise<string> {
  try {
    // Estimate if the document is too long for a single API call
    // A rough estimate: 1 token ≈ 4 characters for English text
    const estimatedTokens = text.length / 4
    const TOKEN_LIMIT = 30000 // Conservative limit for Gemini API

    // If document is short enough, use the regular summarization
    if (estimatedTokens < TOKEN_LIMIT) {
      if (onProgress) onProgress(50, "Summarizing document")
      const summary = await summarizeText(text, title, length)
      if (onProgress) onProgress(100, "Complete")
      return summary
    }

    // For long documents, use a multi-stage approach
    // 1. Split the document into logical sections
    if (onProgress) onProgress(10, "Analyzing document structure")
    const sections = splitIntoSections(text)

    // 2. Summarize each section
    const sectionSummaries = []
    for (let i = 0; i < sections.length; i++) {
      if (onProgress) {
        const progress = 10 + Math.floor((i / sections.length) * 60)
        onProgress(progress, `Summarizing section ${i + 1} of ${sections.length}`)
      }

      const sectionTitle = extractSectionTitle(sections[i]) || `Section ${i + 1}`
      const summary = await summarizeText(sections[i], `${title} - ${sectionTitle}`, "brief")
      sectionSummaries.push(`## ${sectionTitle}\n\n${summary}`)
    }

    // 3. Combine section summaries
    if (onProgress) onProgress(70, "Combining section summaries")
    const combinedSummary = sectionSummaries.join("\n\n")

    // 4. Final pass to create a coherent summary of the desired length
    if (onProgress) onProgress(80, "Creating final summary")
    const finalSummary = await summarizeText(combinedSummary, `${title} (Section Summaries)`, length)

    // 5. Format the final result with the section summaries
    const result = `# Summary of ${title}\n\n${finalSummary}\n\n---\n\n# Detailed Section Summaries\n\n${combinedSummary}`

    if (onProgress) onProgress(100, "Complete")
    return result
  } catch (error) {
    console.error("Error in multi-stage summarization:", error)
    return "Sorry, I encountered an error while generating the summary for this long document."
  }
}

// Helper function to split text into logical sections
function splitIntoSections(text: string): string[] {
  // First try to split by markdown headings
  const headingRegex = /^#{1,3}\s+.+$/gm
  const headingMatches = [...text.matchAll(headingRegex)]

  if (headingMatches.length > 1) {
    const sections = []

    // Get the positions of all headings
    const headingPositions = headingMatches.map((match) => match.index)

    // Create sections based on heading positions
    for (let i = 0; i < headingPositions.length; i++) {
      const start = headingPositions[i]
      const end = i < headingPositions.length - 1 ? headingPositions[i + 1] : text.length

      if (start !== undefined) {
        // TypeScript safety check
        sections.push(text.substring(start, end))
      }
    }

    return sections
  }

  // If no headings found, try to split by paragraphs
  const paragraphs = text.split(/\n{2,}/)

  // If we have a reasonable number of paragraphs, use those
  if (paragraphs.length >= 3 && paragraphs.length <= 20) {
    return paragraphs
  }

  // If all else fails, split by character count
  const MAX_SECTION_LENGTH = 10000 // About 2500 tokens
  const forcedSections = []

  for (let i = 0; i < text.length; i += MAX_SECTION_LENGTH) {
    // Try to find a sentence boundary near the section limit
    let sectionEnd = Math.min(i + MAX_SECTION_LENGTH, text.length)

    // Look for a sentence ending (., !, ?) followed by a space or newline
    if (sectionEnd < text.length) {
      const nextFewChars = text.substring(sectionEnd - 100, sectionEnd + 100)
      const sentenceEndMatch = nextFewChars.match(/[.!?]\s/)

      if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
        // Adjust the section end to the sentence boundary
        sectionEnd = sectionEnd - 100 + sentenceEndMatch.index + 2 // +2 to include the punctuation and space
      }
    }

    forcedSections.push(text.substring(i, sectionEnd))
  }

  return forcedSections
}

// Helper function to extract a title from a section
function extractSectionTitle(section: string): string | null {
  // Try to find a markdown heading
  const headingMatch = section.match(/^(#{1,3})\s+(.+)$/m)

  if (headingMatch && headingMatch[2]) {
    return headingMatch[2].trim()
  }

  // If no heading, try to use the first sentence if it's short
  const firstSentenceMatch = section.match(/^([^.!?]+[.!?])/)

  if (firstSentenceMatch && firstSentenceMatch[1] && firstSentenceMatch[1].length < 100) {
    return firstSentenceMatch[1].trim()
  }

  return null
}

