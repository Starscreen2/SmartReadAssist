"use client"

import type { PDFDocumentProxy } from "pdfjs-dist"

// We need to explicitly set the worker source
const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@4.0.269/build/pdf.worker.min.js`

export async function setupPdf() {
  if (typeof window === "undefined") return null

  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL

  return pdfjs
}

export async function extractPdfText(pdfjs: any, arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let fullText = ""

    // Get total pages
    const numPages = pdf.numPages

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const strings = content.items.map((item: any) => item.str)
      fullText += strings.join(" ") + "\n\n"
    }

    return fullText
  } catch (error) {
    console.error("Error extracting PDF text:", error)
    throw error
  }
}

