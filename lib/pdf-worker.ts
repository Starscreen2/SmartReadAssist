"use client"

import * as pdfjs from "pdfjs-dist"

// This function ensures the PDF.js worker is properly set up
export function setupPdfWorker() {
  if (typeof window === "undefined") {
    return // Skip on server-side
  }

  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    return // Already set up
  }

  try {
    const pdfjsVersion = pdfjs.version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`
  } catch (error) {
    console.error("Failed to set up PDF.js worker:", error)
  }
}

