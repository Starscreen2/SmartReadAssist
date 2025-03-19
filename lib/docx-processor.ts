"use client"

import mammoth from "mammoth"

export async function extractDocxContent(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const html = result.value

    // Convert HTML to Markdown-like format
    // This is a simple conversion that preserves basic structure
    const markdown = html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n")
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n")

      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")

      // Bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")

      // Lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1\n")
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, "$1\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")

      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")

      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, "")

      // Fix spacing
      .replace(/\n\s*\n/g, "\n\n")

    return markdown
  } catch (error) {
    console.error("Error extracting DOCX content:", error)
    throw new Error("Failed to extract content from DOCX file")
  }
}

