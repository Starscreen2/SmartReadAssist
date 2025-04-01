"use server"

import { getNextApiKey } from "@/lib/api-key-manager"
import { incrementApiCounter } from "@/app/api/usage-stats/route"

type RewriteStyle = "simple" | "academic" | "professional" | "concise"

export async function rewriteDocument(
  text: string,
  title: string,
  style: RewriteStyle = "simple",
  onProgress?: (progress: number, stage: string) => void,
  language = "English",
): Promise<string> {
  try {
    // Estimate if the document is too long for a single API call
    const estimatedTokens = text.length / 4
    const TOKEN_LIMIT = 30000 // Conservative limit for Gemini API

    // For long documents, use a chunking approach
    if (estimatedTokens > TOKEN_LIMIT) {
      return await rewriteLongDocument(text, title, style, onProgress, language)
    }

    if (onProgress) onProgress(30, "Analyzing document")

    // Define style parameters
    const styleGuides = {
      simple:
        "Use simple language (around 6th-8th grade reading level). Break complex ideas into shorter sentences. Define technical terms. Use concrete examples. IMPORTANT: The rewritten document MUST be approximately the same length as the original document - aim to match the original word count closely. Do not shorten or summarize the content.",
      academic:
        "Maintain academic rigor but improve clarity. Use precise language and proper citations if present. Organize with clear section headings and logical flow. IMPORTANT: The rewritten document MUST be approximately the same length as the original document - aim to match the original word count closely. Do not shorten or summarize the content.",
      professional:
        "Use clear, professional language. Be concise but thorough. Organize information logically with appropriate headings and bullet points where helpful. IMPORTANT: The rewritten document MUST be approximately the same length as the original document - aim to match the original word count closely. Do not shorten or summarize the content.",
      concise:
        "Reduce length by 30-40% while preserving key information. Eliminate redundancy. Use direct language. Prioritize the most important points.",
    }

    // Create the prompt for the Gemini API
    const prompt = `You are an expert document editor. Rewrite the following document to make it more comprehensible while preserving all important information and meaning. 

Style Guide: ${styleGuides[style]}

Document Title: ${title}
Document Content: 
${text}

Important instructions:
1. Maintain the same overall structure and headings from the original document
2. Preserve all factual information and key points
3. Keep any code snippets, equations, or specialized notation exactly as they appear
4. Format the document using Markdown for headings, lists, and emphasis
5. Do not add new information that wasn't in the original
6. Do not include phrases like "In this document" or meta-commentary about the rewriting process
7. DO NOT use triple backticks (\`\`\`) or indentation to format text as code blocks
8. Use # for headings, * for bullet points, and ** for bold text
9. ${style !== "concise" ? "CRITICAL: The rewritten document MUST match the original document in length. Count the approximate number of words in the original and ensure your rewritten version has a similar word count. Expand on explanations if needed to maintain the original length." : "Aim to reduce the length by 30-40% while preserving key information."}

Return the complete rewritten document in Markdown format.

Please respond in ${language} language.`

    if (onProgress) onProgress(50, "Rewriting document")

    // Get the next API key from our rotation
    const apiKey = await getNextApiKey()

    // Call the Gemini API
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
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    // Track API usage
    incrementApiCounter()

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
      if (onProgress) onProgress(100, "Complete")

      // Process the response to remove any code block formatting
      let result = data.candidates[0].content.parts[0].text || "No rewritten text could be generated."

      // Remove any triple backtick code blocks
      result = result.replace(/```[\s\S]*?```/g, (match) => {
        // Remove the backticks but keep the content
        return match.replace(/```(?:.*?)\n?|\n?```/g, "")
      })

      return result
    } else {
      return "Couldn't parse the response from Gemini API"
    }
  } catch (error) {
    console.error("Error rewriting document:", error)
    return "Sorry, I encountered an error while rewriting the document."
  }
}

// Update the rewriteLongDocument function to use the language parameter
async function rewriteLongDocument(
  text: string,
  title: string,
  style: RewriteStyle,
  onProgress?: (progress: number, stage: string) => void,
  language = "English",
): Promise<string> {
  try {
    // Split the document into manageable sections
    if (onProgress) onProgress(10, "Analyzing document structure")
    const sections = splitIntoSections(text)

    // Rewrite each section
    const rewrittenSections = []
    for (let i = 0; i < sections.length; i++) {
      if (onProgress) {
        const progress = 10 + Math.floor((i / sections.length) * 80)
        onProgress(progress, `Rewriting section ${i + 1} of ${sections.length}`)
      }

      const sectionTitle = extractSectionTitle(sections[i]) || `Section ${i + 1}`
      const rewrittenSection = await rewriteDocument(
        sections[i],
        `${title} - ${sectionTitle}`,
        style,
        undefined,
        language,
      )
      rewrittenSections.push(rewrittenSection)
    }

    // Combine the rewritten sections
    if (onProgress) onProgress(90, "Combining rewritten sections")
    const rewrittenDocument = rewrittenSections.join("\n\n")

    if (onProgress) onProgress(100, "Complete")
    return rewrittenDocument
  } catch (error) {
    console.error("Error in multi-stage document rewriting:", error)
    return "Sorry, I encountered an error while rewriting this long document."
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

