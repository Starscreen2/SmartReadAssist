"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface PDFExtractorProps {
  file: File
  onTextExtracted: (text: string) => void
  onError: (error: Error) => void
}

export function PDFExtractor({ file, onTextExtracted, onError }: PDFExtractorProps) {
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const extractText = async () => {
      try {
        // Load the PDF.js library dynamically
        const pdfjsLib = await import("pdfjs-dist")

        // Set the worker source
        const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.entry")
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

        // Read the file
        const arrayBuffer = await file.arrayBuffer()
        const typedArray = new Uint8Array(arrayBuffer)

        // Load the PDF file
        const loadingTask = pdfjsLib.getDocument(typedArray)

        // Show loading progress
        loadingTask.onProgress = (progressData) => {
          if (progressData.total > 0) {
            setProgress(Math.round((progressData.loaded / progressData.total) * 100))
          }
        }

        const pdf = await loadingTask.promise
        const numPages = pdf.numPages

        toast({
          title: "PDF loaded",
          description: `Processing ${numPages} pages...`,
        })

        // Extract text from each page
        let fullText = `# ${file.name}\n\n`

        for (let i = 1; i <= numPages; i++) {
          setProgress(Math.round((i / numPages) * 100))

          // Get the page
          const page = await pdf.getPage(i)

          // Extract text content
          const textContent = await page.getTextContent()

          // Concatenate the text items
          const pageText = textContent.items.map((item: any) => item.str).join(" ")

          // Add page number and text to full text
          fullText += `## Page ${i}\n\n${pageText}\n\n`
        }

        // Call the callback with the extracted text
        onTextExtracted(fullText)
      } catch (error) {
        console.error("Error extracting PDF text:", error)
        onError(error as Error)
      }
    }

    extractText()
  }, [file, onTextExtracted, onError, toast])

  return (
    <div className="w-full p-4">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-center mt-2 text-sm text-muted-foreground">Extracting PDF text: {progress}%</p>
    </div>
  )
}

