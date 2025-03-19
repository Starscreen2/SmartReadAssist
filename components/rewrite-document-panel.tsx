"use client"

import { useState, useEffect, useCallback } from "react"
import { X, RefreshCw, Save, CheckCircle2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { rewriteDocument } from "@/app/actions/rewrite-document"
import { useDocuments } from "@/context/document-context"
import { RewrittenContent } from "./rewritten-content"

interface RewriteDocumentPanelProps {
  isOpen: boolean
  onClose: () => void
}

type RewriteStyle = "simple" | "academic" | "professional" | "concise"

export function RewriteDocumentPanel({ isOpen, onClose }: RewriteDocumentPanelProps) {
  const { currentDocument, setDocuments } = useDocuments()
  const [rewrittenText, setRewrittenText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("simple")
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Reset rewritten text when document changes
    if (currentDocument) {
      setRewrittenText(null)
      setProgress(0)
      setStage("")
    }
  }, [currentDocument])

  // Function to clean up potential code blocks in the rewritten text
  const cleanupRewrittenText = (text: string): string => {
    // Remove any triple backtick code blocks
    let cleaned = text.replace(/```[\s\S]*?```/g, (match) => {
      // Remove the backticks but keep the content
      return match.replace(/```(?:.*?)\n?|\n?```/g, "")
    })

    // Remove any indentation that might be interpreted as code blocks
    cleaned = cleaned.replace(/^( {4,}|\t+)(.+)$/gm, "$2")

    return cleaned
  }

  const handleRewriteDocument = async () => {
    if (!currentDocument) return

    setIsLoading(true)
    setProgress(0)
    setStage("Starting document rewrite")

    try {
      const result = await rewriteDocument(
        currentDocument.content,
        currentDocument.name,
        rewriteStyle,
        (progressValue, stageText) => {
          // This callback will be called with progress updates
          setProgress(progressValue)
          setStage(stageText)
        },
      )

      // Clean up the rewritten text before setting it
      const cleanedResult = cleanupRewrittenText(result)
      setRewrittenText(cleanedResult)
    } catch (error) {
      console.error("Error rewriting document:", error)
      toast({
        title: "Document rewrite failed",
        description: "There was an error rewriting the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAsNew = useCallback(() => {
    if (!rewrittenText || !currentDocument) return

    // Create a new document with the rewritten text
    const styleSuffix = {
      simple: "Simplified",
      academic: "Academic",
      professional: "Professional",
      concise: "Concise",
    }

    const newDoc = {
      id: Date.now().toString(),
      name: `${currentDocument.name} (${styleSuffix[rewriteStyle]})`,
      content: rewrittenText,
      lastModified: new Date(),
    }

    // Add the document to the list
    setDocuments((prev) => [...prev, newDoc])

    toast({
      title: "Rewritten document saved",
      description: "The rewritten document has been saved as a new document.",
    })
  }, [currentDocument, rewriteStyle, rewrittenText, setDocuments, toast])

  const handleReplaceDocument = useCallback(() => {
    if (!rewrittenText || !currentDocument) return

    // Update the current document with the rewritten text
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === currentDocument.id ? { ...doc, content: rewrittenText, lastModified: new Date() } : doc,
      ),
    )

    toast({
      title: "Document updated",
      description: "The document has been updated with the rewritten text.",
    })

    // Close the panel after replacing
    onClose()
  }, [currentDocument, rewrittenText, setDocuments, toast, onClose])

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
            <Wand2 className="h-4 w-4 mr-2" />
            Rewrite Document
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Rewrite Style</h4>
              <RadioGroup
                value={rewriteStyle}
                onValueChange={(value) => setRewriteStyle(value as RewriteStyle)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="cursor-pointer">
                    <div className="font-medium">Simple</div>
                    <p className="text-xs text-muted-foreground">Easier to understand, simpler language</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="academic" id="academic" />
                  <Label htmlFor="academic" className="cursor-pointer">
                    <div className="font-medium">Academic</div>
                    <p className="text-xs text-muted-foreground">Clear academic style with proper structure</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional" className="cursor-pointer">
                    <div className="font-medium">Professional</div>
                    <p className="text-xs text-muted-foreground">Clear, professional language and organization</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concise" id="concise" />
                  <Label htmlFor="concise" className="cursor-pointer">
                    <div className="font-medium">Concise</div>
                    <p className="text-xs text-muted-foreground">Shorter, more direct version of the document</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleRewriteDocument} disabled={isLoading || !currentDocument} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : rewrittenText ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rewrite Again
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Rewrite Document
                </>
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
              <p className="mt-4 text-muted-foreground">Rewriting document...</p>
              <p className="text-xs text-muted-foreground mt-2">
                {progress < 50 ? "Analyzing document structure and content..." : "Creating improved version..."}
              </p>
            </div>
          ) : rewrittenText ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <RewrittenContent content={rewrittenText} fontSize={14} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Wand2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No rewritten document yet</p>
              <p className="text-sm text-muted-foreground/70">
                {currentDocument
                  ? "Click the Rewrite button to create a more comprehensible version"
                  : "Select a document first to rewrite it"}
              </p>
            </div>
          )}
        </div>

        {rewrittenText && (
          <div className="p-4 border-t">
            <div className="space-y-2">
              <Button variant="default" size="sm" onClick={handleSaveAsNew} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save as New Document
              </Button>
              <Button variant="outline" size="sm" onClick={handleReplaceDocument} className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Replace Current Document
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

