"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDocuments } from "@/context/document-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { extractDocxContent } from "@/lib/docx-processor"

export function DOCXUploadProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { setDocuments, setSelectedDocument } = useDocuments()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith(".docx")) {
      setFile(selectedFile)
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid DOCX file.",
        variant: "destructive",
      })
    }
  }

  const handleProcessDOCX = async () => {
    if (!file) return

    setIsProcessing(true)

    try {
      // Extract content from DOCX
      const extractedContent = await extractDocxContent(file)

      // Format the content
      const formattedContent = `# ${file.name}\n\n${extractedContent}`

      // Create a new document
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        content: formattedContent,
        lastModified: new Date(),
      }

      // Add the document to the list
      setDocuments((prev) => [...prev, newDoc])

      // Select the new document
      setSelectedDocument(newDoc.id)

      toast({
        title: "DOCX processed",
        description: `${file.name} has been added to your documents.`,
      })
    } catch (error) {
      console.error("Error processing DOCX:", error)
      toast({
        title: "DOCX processing failed",
        description: error instanceof Error ? error.message : "Failed to process DOCX. Please try another file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setFile(null)
    }
  }

  // Function to truncate filename for display
  const truncateFilename = (filename: string, maxLength = 40) => {
    if (!filename) return ""
    if (filename.length <= maxLength) return filename

    const extension = filename.slice(filename.lastIndexOf("."))
    const nameWithoutExt = filename.slice(0, filename.lastIndexOf("."))

    if (nameWithoutExt.length <= maxLength - extension.length - 3) {
      return filename
    }

    return `${nameWithoutExt.slice(0, maxLength - extension.length - 3)}...${extension}`
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium mb-2">DOCX Processor</h3>

      <div className="mb-4">
        <input
          type="file"
          accept=".docx"
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
        <div className="flex flex-col space-y-2">
          <div className="text-sm truncate max-w-full" title={file.name}>
            {truncateFilename(file.name)}
          </div>
          <Button onClick={handleProcessDOCX} size="sm" className="self-end">
            Process DOCX
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Processing DOCX...</p>
        </div>
      )}
    </div>
  )
}

