"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Copy, Save, Share2, RefreshCw, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "./markdown-renderer"
import { summarizeText, summarizeLongDocument } from "@/app/actions/summarize"
import { useDocuments } from "@/context/document-context"

interface SummaryPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SummaryPanel({ isOpen, onClose }: SummaryPanelProps) {
  const { currentDocument, setDocuments } = useDocuments()
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [summaryLength, setSummaryLength] = useState<"brief" | "medium" | "detailed">("medium")
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Reset summary when document changes
    if (currentDocument) {
      setSummary(null)
      setProgress(0)
      setStage("")
    }
  }, [currentDocument])

  const generateSummary = async () => {
    if (!currentDocument) return

    setIsLoading(true)
    setProgress(0)
    setStage("Starting summarization")

    try {
      // Estimate document length to decide which summarization method to use
      const estimatedTokens = currentDocument.content.length / 4
      const TOKEN_LIMIT = 30000

      if (estimatedTokens < TOKEN_LIMIT) {
        // For shorter documents, use the simple approach
        setStage("Summarizing document")
        setProgress(30)
        const result = await summarizeText(currentDocument.content, currentDocument.name, summaryLength)
        setProgress(100)
        setSummary(result)
      } else {
        // For longer documents, use the multi-stage approach with progress updates
        const result = await summarizeLongDocument(
          currentDocument.content,
          currentDocument.name,
          summaryLength,
          (progressValue, stageText) => {
            // This callback will be called with progress updates
            setProgress(progressValue)
            setStage(stageText)
          },
        )
        setSummary(result)
      }
    } catch (error) {
      console.error("Error generating summary:", error)
      toast({
        title: "Summary generation failed",
        description: "There was an error generating the summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!summary) return

    navigator.clipboard.writeText(summary)
    setCopied(true)

    toast({
      title: "Summary copied",
      description: "The summary has been copied to your clipboard.",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = useCallback(() => {
    if (!summary || !currentDocument) return

    // Create a new document with the summary
    const newDoc = {
      id: Date.now().toString(),
      name: `Summary of ${currentDocument.name}`,
      content: `# Summary of ${currentDocument.name}\n\n${summary}`,
      lastModified: new Date(),
    }

    // Add the document to the list
    setDocuments((prev) => [...prev, newDoc])

    toast({
      title: "Summary saved",
      description: "The summary has been saved as a new document.",
    })
  }, [currentDocument, setDocuments, summary, toast])

  const handleShare = () => {
    if (!summary) return

    // For now, just copy to clipboard with a different message
    navigator.clipboard.writeText(summary)

    toast({
      title: "Summary ready to share",
      description: "The summary has been copied to your clipboard for sharing.",
    })
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-40 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Document Summary
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Summary Length</h4>
              <RadioGroup
                value={summaryLength}
                onValueChange={(value) => setSummaryLength(value as "brief" | "medium" | "detailed")}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="brief" id="brief" />
                  <Label htmlFor="brief" className="text-sm cursor-pointer">
                    Brief
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-sm cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <Label htmlFor="detailed" className="text-sm cursor-pointer">
                    Detailed
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={generateSummary} disabled={isLoading || !currentDocument} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : summary ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Summary
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-xs mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center mt-1 text-muted-foreground">{stage}</p>
              </div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mt-4"></div>
              <p className="mt-4 text-muted-foreground">Generating summary...</p>
              <p className="text-xs text-muted-foreground mt-2">
                {progress < 50 ? "Analyzing document structure and content..." : "Creating comprehensive summary..."}
              </p>
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={summary} fontSize={14} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No summary generated yet</p>
              <p className="text-sm text-muted-foreground/70">
                {currentDocument
                  ? "Click the Generate button to create a summary"
                  : "Select a document first to generate a summary"}
              </p>
            </div>
          )}
        </div>

        {summary && (
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

