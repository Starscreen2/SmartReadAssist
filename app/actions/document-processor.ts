"use server"

// Import the PDF processor
import { processPdf } from "./pdf-processor"

export type ProcessedDocument = {
  content: string
  metadata: {
    title: string
    type: string
    pageCount?: number
    url?: string // Add URL for PDFs
  }
}

export async function processDocument(formData: FormData): Promise<ProcessedDocument | null> {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    const fileType = file.name.split(".").pop()?.toLowerCase()

    // Process different file types
    if (fileType === "pdf") {
      // For PDF files, use our dedicated PDF processor
      const content = await processPdf(formData)

      return {
        content,
        metadata: {
          title: file.name,
          type: "pdf",
          pageCount: 1, // This would be determined by the PDF parser in a real app
        },
      }
    } else if (fileType === "txt" || fileType === "md") {
      // For text files, we can just read the content
      const buffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(buffer)
      return {
        content: text,
        metadata: {
          title: file.name,
          type: fileType,
        },
      }
    } else if (fileType === "docx") {
      // For DOCX files, we'll return a placeholder that instructs the user
      // to use the client-side DOCX processor
      return {
        content: `# ${file.name}

## DOCX Processing

This DOCX file can be processed using our client-side DOCX processor for better results.

### How to Process DOCX Files

For the best experience with DOCX files:

1. Click the "Upload" button in the sidebar
2. Select the "DOCX Files" tab
3. Choose your DOCX file and click "Process DOCX"

This will extract the text content directly in your browser using mammoth.js.`,
        metadata: {
          title: file.name,
          type: "docx",
        },
      }
    } else {
      // Unsupported file type
      throw new Error(`Unsupported file type: ${fileType}`)
    }
  } catch (error) {
    console.error("Error processing document:", error)
    return null
  }
}

