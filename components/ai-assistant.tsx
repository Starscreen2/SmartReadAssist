"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { askGemini } from "@/app/actions/gemini"
import { useDocuments } from "@/context/document-context"
// Add import for the language context
import { useLanguage } from "@/context/language-context"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { History, Maximize2, MessageSquare, Minimize2, MoreVertical, Send, Sparkles, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SimpleMarkdownRenderer } from "@/components/simple-markdown-renderer"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function AIAssistant() {
  const { currentDocument } = useDocuments()
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your reading assistant. I'm aware of the document you're reading and can answer questions about it. Ask me anything or highlight text for an explanation.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [highlightExplanation, setHighlightExplanation] = useState<string | null>(null)
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 })
  const [highlightText, setHighlightText] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [visibleContent, setVisibleContent] = useState<string>("")
  const [savedChats, setSavedChats] = useState<{ id: string; title: string; messages: Message[] }[]>([])
  const [showSavedChatsDialog, setShowSavedChatsDialog] = useState(false)
  const [confirmClearDialog, setConfirmClearDialog] = useState(false)
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false)

  // Add a state to track the current language for the highlight explanation
  const [currentHighlightLanguage, setCurrentHighlightLanguage] = useState(language)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Update initial message when document or language changes
  useEffect(() => {
    if (currentDocument) {
      // Reset visible content when document changes
      setVisibleContent("")

      // Update the welcome message with the current language
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm your reading assistant. I'm currently aware of your document "${currentDocument.name}". Ask me anything about it or highlight text for an explanation. I'll respond in ${language.name}.`,
        },
      ])
    }
  }, [currentDocument, language])

  // Add a new effect to update visible content when document changes
  useEffect(() => {
    if (!currentDocument) return

    // Update visible content after a short delay to ensure the document is rendered
    const timer = setTimeout(() => {
      const updateVisibleContent = () => {
        const contentElement = document.querySelector(".reader-content .prose")
        if (!contentElement) return

        // Get all text nodes that are visible in the viewport
        const allTextNodes = Array.from(contentElement.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote"))

        // Filter to only the visible ones
        const visibleNodes = allTextNodes.filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.top < window.innerHeight && rect.bottom > 0
        })

        // Extract text from visible nodes
        const visibleText = visibleNodes.map((node) => node.textContent).join("\n\n")
        setVisibleContent(visibleText || "")
      }

      updateVisibleContent()
    }, 300) // Short delay to ensure document is rendered

    return () => clearTimeout(timer)
  }, [currentDocument])

  // Add an effect to track visible content in the document
  useEffect(() => {
    if (!currentDocument) return

    // Function to extract visible text from the document viewer
    const updateVisibleContent = () => {
      const contentElement = document.querySelector(".reader-content .prose")
      if (!contentElement) return

      // Get all text nodes that are visible in the viewport
      const allTextNodes = Array.from(contentElement.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote"))

      // Filter to only the visible ones
      const visibleNodes = allTextNodes.filter((node) => {
        const rect = node.getBoundingClientRect()
        return rect.top < window.innerHeight && rect.bottom > 0
      })

      // Extract text from visible nodes
      const visibleText = visibleNodes.map((node) => node.textContent).join("\n\n")
      setVisibleContent(visibleText || "")
    }

    // Initial update
    updateVisibleContent()

    // Update on scroll
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleContent)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [currentDocument])

  // Add an effect to listen for language changes
  useEffect(() => {
    // Update the current highlight language when the system language changes
    setCurrentHighlightLanguage(language)

    // Listen for language change events
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        setCurrentHighlightLanguage(customEvent.detail)
      }
    }

    window.addEventListener("languageChanged", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange)
    }
  }, [language])

  // Load saved chats from localStorage on initial render
  useEffect(() => {
    const loadSavedChats = () => {
      try {
        const saved = localStorage.getItem("ai-assistant-saved-chats")
        if (saved) {
          setSavedChats(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load saved chats:", error)
      }
    }

    loadSavedChats()
  }, [])

  // Save chats to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("ai-assistant-saved-chats", JSON.stringify(savedChats))
    } catch (error) {
      console.error("Failed to save chats:", error)
    }
  }, [savedChats])

  // Add a new useEffect to handle window resizing
  // Add this after the other useEffect hooks:

  // Add window resize handler to keep popup in view
  useEffect(() => {
    if (!highlightExplanation) return

    const handleResize = () => {
      // Recalculate position to ensure popup stays in view
      if (highlightText) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          // Use the same positioning logic as in explainHighlightedText
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          const xPos = Math.min(Math.max(rect.left + rect.width / 2, 200), viewportWidth - 200)

          const yPos = rect.bottom + window.scrollY
          const isTooLow = rect.bottom + 300 > viewportHeight
          const finalYPos = isTooLow ? rect.top + window.scrollY - 10 : yPos

          setHighlightPosition({
            x: xPos,
            y: finalYPos,
          })
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [highlightExplanation, highlightText])

  const handleClearChat = () => {
    setConfirmClearDialog(true)
  }

  const confirmClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm your reading assistant. I'm currently aware of your document "${currentDocument?.name || "you are reading"}". Ask me anything about it or highlight text for an explanation.`,
      },
    ])
    setConfirmClearDialog(false)
  }

  const handleNewChat = () => {
    // Save current chat if it has user messages
    if (messages.length > 1 && messages.some((m) => m.role === "user")) {
      // Create a title from the first user message
      const firstUserMessage = messages.find((m) => m.role === "user")
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
        : `Chat ${new Date().toLocaleString()}`

      const chatToSave = {
        id: Date.now().toString(),
        title,
        messages: [...messages],
      }

      // Update saved chats (avoid duplicates)
      setSavedChats((prev) => {
        const existingChatIndex = prev.findIndex((chat) => chat.title === title)
        if (existingChatIndex !== -1) {
          const updatedChats = [...prev]
          updatedChats[existingChatIndex] = chatToSave
          return updatedChats
        } else {
          return [chatToSave, ...prev]
        }
      })
    }

    // Start a new chat
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm your reading assistant. I'm currently aware of your document "${currentDocument?.name || "you are reading"}". Ask me anything about it or highlight text for an explanation.`,
      },
    ])
  }

  const loadSavedChat = (chatId: string) => {
    const chat = savedChats.find((c) => c.id === chatId)
    if (chat) {
      setMessages(chat.messages)
      setShowSavedChatsDialog(false)
    }
  }

  const deleteSavedChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click handler
    setSavedChats((prev) => prev.filter((chat) => chat.id !== chatId))
  }

  // Modify the handleSend function to include language instructions in the prompt
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Include language instruction in the prompt
      let contextPrompt = input
      if (currentDocument && visibleContent) {
        // Create a prompt that includes only the visible content and language instruction
        contextPrompt = `
I'm reading a document titled "${currentDocument.name}" (ID: ${currentDocument.id}). 
Here's my question: ${input}

For context, here's the part of the document I'm currently looking at:
${visibleContent}

Please respond in ${language.name} (${language.code}).
`
      } else {
        // If no document context, still include language instruction
        contextPrompt = `${input}

Please respond in ${language.name} (${language.code}).`
      }

      const response = await askGemini(contextPrompt)
      const updatedMessages = [...messages, userMessage, { role: "assistant", content: response }]
      setMessages(updatedMessages)

      // Automatically save the chat if it has user messages
      if (updatedMessages.some((m) => m.role === "user")) {
        // Create a title from the first user message
        const firstUserMessage = updatedMessages.find((m) => m.role === "user")
        const title = firstUserMessage
          ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
          : `Chat ${new Date().toLocaleString()}`

        const newChat = {
          id: Date.now().toString(),
          title,
          messages: updatedMessages,
        }

        // Update saved chats (avoid duplicates by checking if a chat with the same title exists)
        setSavedChats((prev) => {
          // Check if a chat with the same title already exists
          const existingChatIndex = prev.findIndex((chat) => chat.title === title)
          if (existingChatIndex !== -1) {
            // Update existing chat
            const updatedChats = [...prev]
            updatedChats[existingChatIndex] = newChat
            return updatedChats
          } else {
            // Add new chat
            return [newChat, ...prev]
          }
        })
      }
    } catch (error) {
      console.error("Error getting response:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Helper function to normalize text for better matching
  const normalizeText = (text: string): string => {
    return text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/[\n\r]+/g, " ") // Replace newlines with spaces
      .trim() // Remove leading/trailing whitespace
  }

  // Enhanced function to get context around the highlighted text
  const getTextWithContext = (selectedText: string): { text: string; context: string } => {
    console.log("DEBUG - getTextWithContext called with text:", selectedText.substring(0, 50) + "...")

    if (!currentDocument) {
      console.log("DEBUG - No current document found")
      return { text: selectedText, context: "" }
    }

    console.log("DEBUG - Current document name:", currentDocument.name)

    const fullContent = currentDocument.content

    // Normalize both the selected text and document content for better matching
    const normalizedSelectedText = normalizeText(selectedText)
    const normalizedContent = normalizeText(fullContent)

    // Try to find the selected text in the normalized content
    const selectedIndex = normalizedContent.indexOf(normalizedSelectedText)
    console.log("DEBUG - Selected index in normalized document:", selectedIndex)

    if (selectedIndex === -1) {
      console.log("DEBUG - Selected text not found in normalized document content!")

      // If we can't find the exact text, try to use the visible content
      if (visibleContent && visibleContent.includes(selectedText)) {
        console.log("DEBUG - Found selected text in visible content")

        // Get approximate position in visible content
        const visibleIndex = visibleContent.indexOf(selectedText)
        const beforeContext = visibleContent.substring(Math.max(0, visibleIndex - 2000), visibleIndex)
        const afterContext = visibleContent.substring(
          visibleIndex + selectedText.length,
          Math.min(visibleContent.length, visibleIndex + selectedText.length + 2000),
        )

        const fullContext =
          beforeContext + "[HIGHLIGHTED TEXT START]" + selectedText + "[HIGHLIGHTED TEXT END]" + afterContext
        return { text: selectedText, context: fullContext }
      }

      // Last resort: just use the selected text with minimal context
      return {
        text: selectedText,
        context: `[HIGHLIGHTED TEXT START]${selectedText}[HIGHLIGHTED TEXT END]`,
      }
    }

    // We found the text in the document, so get proper context around it
    // Get approximately 2000 characters before and 2000 after
    const CONTEXT_CHARS = 2000

    // Find the actual position in the original content (not normalized)
    // This is an approximation since normalization changes character positions
    const approximateStartIndex = Math.max(0, selectedIndex - CONTEXT_CHARS)
    const approximateEndIndex = Math.min(
      normalizedContent.length,
      selectedIndex + normalizedSelectedText.length + CONTEXT_CHARS,
    )

    // Extract context from the original content
    const beforeContext = fullContent.substring(Math.max(0, approximateStartIndex), fullContent.indexOf(selectedText))
    const afterContext = fullContent.substring(
      fullContent.indexOf(selectedText) + selectedText.length,
      Math.min(fullContent.length, approximateEndIndex),
    )

    // Create the final context with markers
    const finalContext =
      beforeContext + "[HIGHLIGHTED TEXT START]" + selectedText + "[HIGHLIGHTED TEXT END]" + afterContext

    console.log("DEBUG - Context extraction:")
    console.log("Selected text length:", selectedText.length)
    console.log("Before context length:", beforeContext.length)
    console.log("After context length:", afterContext.length)
    console.log("Total context length:", finalContext.length)

    return {
      text: selectedText,
      context: finalContext,
    }
  }

  // Extract the term to be explained (for bolding)
  const extractTermToExplain = (text: string): string => {
    // If the text is a single word, use that
    if (!text.includes(" ")) return text

    // If it's a short phrase (2-3 words), use the whole thing
    const words = text.split(" ")
    if (words.length <= 3) return text

    // For longer selections, try to identify a key term or use the first few words
    if (text.length > 500) {
      // For very long text, use a more general title
      const firstFewWords = words.slice(0, 3).join(" ")
      return `${firstFewWords}...`
    }

    // Look for capitalized words which might be terms/concepts
    const capitalizedWords = words.filter(
      (word) => word.length > 1 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase(),
    )

    if (capitalizedWords.length === 1) return capitalizedWords[0]

    // If there are multiple capitalized words, look for common term patterns
    const possibleTerms = words.filter(
      (word) =>
        word.match(/^[A-Z][a-z]*$/) || // Single capitalized word
        word.match(/^[A-Z]{2,}$/) || // Acronym
        word.match(/^[A-Z][a-z]+[A-Z][a-z]+$/), // CamelCase
    )

    if (possibleTerms.length === 1) return possibleTerms[0]

    // If we can't identify a clear term, use the first few words
    return words.slice(0, Math.min(3, words.length)).join(" ")
  }

  // Update the explainHighlightedText function to use the current language
  const explainHighlightedText = async (text: string) => {
    if (!text.trim() || text.length < 5) return // Ignore very short selections
    if (!currentDocument) return // Don't process if no document is selected

    console.log("DEBUG - explainHighlightedText called with text length:", text.length)
    console.log("DEBUG - First 50 chars of selected text:", text.substring(0, 50))
    console.log("DEBUG - Using language:", language.name, language.code)

    // Verify the selection is within the current document's content area
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Check if the selection is within the document content area
    const range = selection.getRangeAt(0)
    const contentElement = document.querySelector(".reader-content .prose")
    if (!contentElement || !contentElement.contains(range.commonAncestorContainer)) {
      console.log("DEBUG - Selection is outside the current document content area")
      return
    }

    setIsLoading(true)
    setHighlightText(text)

    try {
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // Calculate a better position that ensures visibility
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Position horizontally - aim for center of selection but keep in viewport
        // Ensure at least 200px from either edge to accommodate the popup width
        const xPos = Math.min(Math.max(rect.left + rect.width / 2, 200), viewportWidth - 200)

        // Position vertically - place below selection but ensure it's visible
        // If too close to bottom, position above selection
        const yPos = rect.bottom + window.scrollY
        const isTooLow = rect.bottom + 300 > viewportHeight
        const finalYPos = isTooLow ? rect.top + window.scrollY - 10 : yPos

        setHighlightPosition({
          x: xPos,
          y: finalYPos,
        })

        // Log more details about the selection
        console.log("DEBUG - Selection details:")
        console.log("- Selection type:", selection.type)
        console.log("- Selection range count:", selection.rangeCount)
        console.log("- Selection as string:", selection.toString().substring(0, 50) + "...")
        console.log("- Viewport dimensions:", viewportWidth, "x", viewportHeight)
        console.log("- Selection rect:", rect.left, rect.top, rect.right, rect.bottom)
        console.log("- Calculated position:", xPos, finalYPos)
      }

      // Get the highlighted text with surrounding context
      const { text: selectedText, context: textWithContext } = getTextWithContext(text)

      // Add these debug logs
      console.log("DEBUG - Prompt construction:")
      console.log("textWithContext length:", textWithContext.length)

      // Extract the term to be explained
      const termToExplain = extractTermToExplain(selectedText)

      // Include document title for additional context
      const documentTitle = currentDocument.name

      // Store the current language to ensure consistency even if language changes during API call
      const currentLang = language

      // Create a prompt that focuses on explaining the highlighted text but uses the context
      // Add language instruction with strong emphasis
      const prompt = `
You are an expert reading assistant. Explain the highlighted portion of text below clearly and concisely.
Focus ONLY on explaining the text between [HIGHLIGHTED TEXT START] and [HIGHLIGHTED TEXT END] markers.
Use the surrounding context to inform your explanation and provide a more accurate understanding.

Document Title: ${documentTitle}
Text with Context:
${textWithContext}

${
  selectedText.length > 500
    ? `This is a longer text selection. Provide a concise summary (3-5 sentences) that captures the main points, key arguments, and significance of ONLY the highlighted text.`
    : `Provide an extremely concise explanation (maximum 2-3 short sentences) of ONLY the highlighted text, making sure to:
1. Use simple, everyday language - avoid jargon unless absolutely necessary
2. Focus on the core meaning or main point only
3. Be direct and straightforward - no unnecessary words
4. If technical terms must be used, briefly define them`
}

Format your response with the term "${termToExplain}" in bold at the beginning, like this:
**${termToExplain}**: Your explanation here...

Your explanation should be immediately understandable to someone with no background knowledge.

IMPORTANT: You MUST respond in ${currentLang.name} (${currentLang.code}). The entire explanation must be in ${currentLang.name} only.
`

      // Add this debug log
      console.log("DEBUG - Final prompt length:", prompt.length)
      console.log("DEBUG - Language instruction:", `respond in ${currentLang.name} (${currentLang.code})`)

      const response = await askGemini(prompt)
      setHighlightExplanation(response)

      // Save the language used for this explanation
      setCurrentHighlightLanguage(currentLang)
    } catch (error) {
      console.error("Error explaining text:", error)
      setHighlightExplanation("Sorry, I couldn't explain that text. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for text selection events
  useEffect(() => {
    const handleSelection = () => {
      // Only process selection if we have a current document
      if (!currentDocument) return

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      // Check if the selection is within the document content area
      const range = selection.getRangeAt(0)
      const contentElement = document.querySelector(".reader-content .prose")

      if (
        contentElement &&
        contentElement.contains(range.commonAncestorContainer) &&
        selection.toString().trim().length > 0
      ) {
        // Only show explanation when user has completed selection within the document
        explainHighlightedText(selection.toString())
      } else {
        setHighlightExplanation(null)
        setHighlightText(null)
      }
    }

    document.addEventListener("mouseup", handleSelection)
    return () => {
      document.removeEventListener("mouseup", handleSelection)
    }
  }, [currentDocument, language]) // Add language as a dependency to re-register the event listener when language changes

  const addHighlightToChat = () => {
    if (!highlightText || !highlightExplanation) return

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Can you explain this text: "${highlightText}"` },
      { role: "assistant", content: highlightExplanation },
    ])

    setHighlightExplanation(null)
    setHighlightText(null)
    setIsOpen(true)
  }

  return (
    <TooltipProvider>
      {/* Floating AI button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
            onClick={() => setIsOpen(true)}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>

      {/* Chat dialog */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 bg-background border rounded-lg shadow-xl flex flex-col z-50 transition-all duration-300 ease-in-out",
            isExpanded ? "w-[80vw] h-[80vh] max-w-4xl" : "w-96 h-[450px]", // Increased from w-80 h-96
          )}
        >
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex flex-col">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                <h3 className="font-medium">AI Assistant</h3>
              </div>
              {currentDocument && (
                <span className="text-xs text-muted-foreground mt-1">Document: {currentDocument.name}</span>
              )}
              {visibleContent && (
                <span className="text-xs text-muted-foreground mt-0.5">(Aware of visible content)</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleNewChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    New chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSavedChatsDialog(true)}>
                    <History className="h-4 w-4 mr-2" />
                    View saved chats
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleClearChat}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 shadow-sm",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border/50",
                  )}
                >
                  {message.role === "assistant" ? (
                    <SimpleMarkdownRenderer content={message.content} fontSize={14} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted border border-border/50 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce delay-75" />
                    <div className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about your document (in ${language.name})...`}
                className="min-h-10 resize-none"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Highlight explanation popup - now using MarkdownRenderer */}
      {highlightExplanation && (
        <div
          className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 max-w-md fade-in"
          style={{
            // Calculate position to ensure popup is visible
            left: Math.min(
              Math.max(highlightPosition.x, 200), // Ensure at least 200px from left edge
              window.innerWidth - 220, // Ensure at least 220px from right edge
            ),
            top: Math.min(
              highlightPosition.y + 10,
              window.innerHeight - 200, // Ensure popup doesn't go too far down
            ),
            transform: "translateX(-50%)",
            maxHeight: "calc(100vh - 100px)", // Limit max height
            overflowY: "auto", // Add scrolling if content is too tall
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <h4 className="font-medium text-sm">AI Explanation ({currentHighlightLanguage.name})</h4>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={addHighlightToChat}
                title="Add to chat"
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setHighlightExplanation(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            <SimpleMarkdownRenderer content={highlightExplanation} fontSize={14} />
          </div>
        </div>
      )}

      {/* Saved Chats Dialog */}
      <Dialog open={showSavedChatsDialog} onOpenChange={setShowSavedChatsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Chats</DialogTitle>
            <DialogDescription>Select a chat to continue the conversation.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {savedChats.length > 0 ? (
              <div className="space-y-2 mt-2">
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => loadSavedChat(chat.id)}
                  >
                    <div className="truncate">{chat.title}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 ml-2"
                      onClick={(e) => deleteSavedChat(chat.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No saved chats yet</p>
                <p className="text-sm mt-1">Your saved conversations will appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Chat Dialog */}
      <Dialog open={confirmClearDialog} onOpenChange={setConfirmClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear the current chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearChat}>
              Clear Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

