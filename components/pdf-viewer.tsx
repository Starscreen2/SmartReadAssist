"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

interface PDFViewerProps {
  pdfUrl: string
  fileName: string
}

export function PDFViewer({ pdfUrl, fileName }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">{fileName}</h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={pdfUrl} download={fileName}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </div>

      <div className="flex-1 border rounded-md overflow-hidden bg-muted/30">
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">PDF Viewer Not Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            PDF viewing requires client-side processing with PDF.js. This feature will be implemented in a future
            update.
          </p>
          <Button asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Open PDF in New Tab
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

