"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDocuments } from "@/context/document-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function PDFUploadProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { setDocuments, setSelectedDocument } = useDocuments()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid PDF file.",
        variant: "destructive",
      })
    }
  }

  const handleProcessPDF = async () => {
    if (!file) return

    setIsProcessing(true)

    try {
      // Create a simple placeholder for the PDF content
      // This is a fallback since PDF.js is having issues
      const formattedText = `# ${file.name}

## PDF Content

This is a placeholder for the content of your PDF file "${file.name}".

PDF text extraction is currently limited in this environment. For best results:

1. Copy and paste the text from your PDF into a new document
2. Save it as a Markdown (.md) file
3. Upload the Markdown file instead

Alternatively, you can view the PDF in your preferred PDF reader and reference it while using this application.

### Future Improvements

In a future update, we plan to implement a more robust PDF text extraction solution that works reliably in all environments.`

      // Create a new document
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        content: formattedText,
        lastModified: new Date(),
      }

      // Add the document to the list
      setDocuments((prev) => [...prev, newDoc])

      // Select the new document
      setSelectedDocument(newDoc.id)

      toast({
        title: "PDF added",
        description: `${file.name} has been added to your documents with placeholder content.`,
      })
    } catch (error) {
      console.error("Error processing PDF:", error)
      toast({
        title: "PDF processing failed",
        description: error instanceof Error ? error.message : "Failed to process PDF. Please try another file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setFile(null)
    }
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium mb-2">PDF Processor</h3>

      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90"
          disabled={isProcessing}
        />
      </div>

      {file && !isProcessing && (
        <div className="flex justify-between items-center">
          <span className="text-sm truncate">{file.name}</span>
          <Button onClick={handleProcessPDF} size="sm">
            Add PDF
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Processing PDF...</p>
        </div>
      )}
    </div>
  )
}

