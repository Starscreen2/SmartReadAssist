"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sun,
  Moon,
  Minus,
  Plus,
  Settings,
  Menu,
  BookOpen,
  Download,
  AlignJustify,
  Wand2,
  BookmarkPlus,
  BookmarkIcon as BookmarkList,
  Pencil,
  Globe,
  Check,
  MoreVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SimpleMarkdownRenderer } from "./simple-markdown-renderer"
import { SummaryPanel } from "./summary-panel"
import { RewriteDocumentPanel } from "./rewrite-document-panel"
import { BookmarkPanel } from "./bookmark-panel"
import { useDocuments } from "@/context/document-context"
import { useBookmarks, type Bookmark as BookmarkType } from "@/context/bookmark-context"
import { useTheme } from "./theme-provider"
import { useSidebar } from "@/context/sidebar-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/context/language-context"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMobile } from "@/hooks/use-mobile"

export function DocumentReader() {
  const { currentDocument, setDocuments } = useDocuments()
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, isExpanded } = useSidebar()
  const { addBookmark, getDocumentBookmarks } = useBookmarks()
  const { toast } = useToast()
  const [fontSize, setFontSize] = useState(16)
  const [isLoading, setIsLoading] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false)
  const [rewritePanelOpen, setRewriteDocumentPanelOpen] = useState(false)
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false)
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false)
  const [bookmarkName, setBookmarkName] = useState("")
  const [bookmarkNote, setBookmarkNote] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [aiToolsInfoOpen, setAiToolsInfoOpen] = useState(false)
  const [settingsInfoOpen, setSettingsInfoOpen] = useState(false)

  // Add state for bookmark notification
  const [showBookmarkNotification, setShowBookmarkNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  const { language, setLanguage, languages } = useLanguage()
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false)

  const { isMobile, isTouch } = useMobile()

  // Debug log to check document changes
  useEffect(() => {
    console.log("Document Reader - Current document:", currentDocument)
  }, [currentDocument])

  // Add this effect to check for editing mode flag
  useEffect(() => {
    const editingFlag = localStorage.getItem("document-editing-mode")

    if (editingFlag === "true" && currentDocument) {
      // Set editing mode and content
      setEditContent(currentDocument.content)
      setIsEditing(true)

      // Clear the flag
      localStorage.removeItem("document-editing-mode")

      // Optional: Show a toast notification
      toast({
        title: "Edit mode activated",
        description: "You can now edit your new document",
      })
    }
  }, [currentDocument, toast])

  const increaseFont = () => {
    setFontSize((prev) => Math.min(prev + 1, 24))
  }

  const decreaseFont = () => {
    setFontSize((prev) => Math.max(prev - 1, 12))
  }

  const handleExport = () => {
    if (!currentDocument) return

    // Create a blob with the document content
    const blob = new Blob([currentDocument.content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentDocument.name}.md`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSummaryPanel = () => {
    setSummaryPanelOpen(!summaryPanelOpen)
    if (rewritePanelOpen) setRewriteDocumentPanelOpen(false)
    if (bookmarkPanelOpen) setBookmarkPanelOpen(false)
  }

  const toggleRewritePanel = () => {
    setRewriteDocumentPanelOpen(!rewritePanelOpen)
    if (summaryPanelOpen) setSummaryPanelOpen(false)
    if (bookmarkPanelOpen) setBookmarkPanelOpen(false)
  }

  const toggleBookmarkPanel = () => {
    setBookmarkPanelOpen(!bookmarkPanelOpen)
    if (summaryPanelOpen) setSummaryPanelOpen(false)
    if (rewritePanelOpen) setRewriteDocumentPanelOpen(false)
  }

  // Update the handleAddBookmark function to show the bookmark notification
  const handleAddBookmark = () => {
    if (!currentDocument) return

    // Show bookmark notification
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      setNotificationMessage("Text selected for bookmark")
      setSelectedText(selection.toString())

      // Generate a default name from the selected text (truncate if too long)
      const defaultName = selection.toString().trim().substring(0, 40) + (selection.toString().length > 40 ? "..." : "")
      setBookmarkName(defaultName)

      setBookmarkDialogOpen(true)
    } else {
      // If no text is selected, create a bookmark at the current scroll position
      if (contentRef.current) {
        const scrollPosition = contentRef.current.scrollTop
        const scrollPercentage = Math.round((scrollPosition / contentRef.current.scrollHeight) * 100)

        setNotificationMessage(`Bookmarked at position ${scrollPercentage}%`)
        setShowBookmarkNotification(true)

        // Hide notification after 2 seconds (matches animation duration)
        setTimeout(() => {
          setShowBookmarkNotification(false)
        }, 2000)

        const bookmarkName = `${currentDocument.name} - Position ${scrollPercentage}%`

        addBookmark({
          documentId: currentDocument.id,
          position: `scroll:${scrollPosition}`,
          name: bookmarkName,
        })

        toast({
          title: "Bookmark added",
          description: `"${bookmarkName}" has been added to your bookmarks.`,
          action: (
            <Button variant="outline" size="sm" onClick={toggleBookmarkPanel}>
              View
            </Button>
          ),
        })
      }
    }
  }

  const handleSaveBookmark = () => {
    if (!currentDocument || !selectedText) return

    const name = bookmarkName || "Unnamed Bookmark"

    addBookmark({
      documentId: currentDocument.id,
      position: `text:${selectedText}`,
      name: name,
      note: bookmarkNote,
    })

    setBookmarkDialogOpen(false)
    setBookmarkName("")
    setBookmarkNote("")
    setSelectedText("")

    // Show notification
    setNotificationMessage(`Bookmarked: "${name.substring(0, 20)}${name.length > 20 ? "..." : ""}"`)
    setShowBookmarkNotification(true)

    // Hide notification after 2 seconds (matches animation duration)
    setTimeout(() => {
      setShowBookmarkNotification(false)
    }, 2000)

    toast({
      title: "Bookmark added",
      description: `"${name}" has been added to your bookmarks.`,
      action: (
        <Button variant="outline" size="sm" onClick={toggleBookmarkPanel}>
          View
        </Button>
      ),
    })
  }

  const handleJumpToBookmark = (bookmark: BookmarkType) => {
    if (!contentRef.current || !currentDocument) return

    if (bookmark.position.startsWith("scroll:")) {
      // Handle scroll position bookmarks
      const scrollPosition = Number.parseInt(bookmark.position.split(":")[1])
      contentRef.current.scrollTop = scrollPosition

      // Show a toast notification
      toast({
        title: "Jumped to bookmark",
        description: `Navigated to "${bookmark.name}"`,
      })
    } else if (bookmark.position.startsWith("text:")) {
      // Handle text selection bookmarks
      const text = bookmark.position.split(":")[1]

      // Find the text in the document
      const documentText = currentDocument.content
      const textIndex = documentText.indexOf(text)

      if (textIndex !== -1) {
        // Calculate approximate scroll position based on text position
        // This is a rough estimate - the ratio of text position to total text length
        const textPositionRatio = textIndex / documentText.length
        const approximateScrollPosition = contentRef.current.scrollHeight * textPositionRatio

        // Scroll to the approximate position
        contentRef.current.scrollTop = approximateScrollPosition

        // After scrolling, try to find and highlight the text
        setTimeout(() => {
          // Use the browser's find functionality to locate the text
          window.find(text, false, false, true, false, true, false)

          // Show a toast notification
          toast({
            title: "Jumped to bookmark",
            description: `Navigated to "${bookmark.name}"`,
          })
        }, 100)
      } else {
        // If text not found, show an error
        toast({
          title: "Bookmark text not found",
          description: "The bookmarked text could not be found in the current document.",
          variant: "destructive",
        })
      }
    }

    // Close the bookmark panel
    setBookmarkPanelOpen(false)
  }

  // Helper function to get all text nodes in an element
  const getTextNodes = (node: Node): Text[] => {
    const textNodes: Text[] = []

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text)
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i])
        }
      }
    }

    walk(node)
    return textNodes
  }

  // Add a function to render bookmark indicators in the document
  const renderBookmarkIndicators = () => {
    if (!currentDocument || !contentRef.current) return null

    const bookmarks = getDocumentBookmarks(currentDocument.id)
    const scrollBookmarks = bookmarks.filter((b) => b.position.startsWith("scroll:"))

    return scrollBookmarks.map((bookmark) => {
      const scrollPosition = Number.parseInt(bookmark.position.split(":")[1])
      const containerHeight = contentRef.current?.scrollHeight || 1
      const positionPercentage = (scrollPosition / containerHeight) * 100

      return (
        <div
          key={bookmark.id}
          className="absolute right-0 w-1 h-4 bg-primary rounded-l-sm transform -translate-y-1/2 cursor-pointer hover:w-2 transition-all"
          style={{ top: `${positionPercentage}%` }}
          title={bookmark.name}
          onClick={() => handleJumpToBookmark(bookmark)}
        />
      )
    })
  }

  // Get the ripple color based on the current theme
  const getRippleColor = () => {
    if (theme === "dark" || theme === "night") {
      return "rgba(255, 255, 255, 0.3)"
    }
    return "rgba(0, 0, 0, 0.2)"
  }

  useEffect(() => {
    if (!contentRef.current) return

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 100
      // Right swipe (open sidebar)
      if (touchEndX - touchStartX > swipeThreshold) {
        toggleSidebar()
      }
      // Left swipe (close sidebar if open)
      else if (touchStartX - touchEndX > swipeThreshold) {
        toggleSidebar()
      }
    }

    const element = contentRef.current
    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [toggleSidebar])

  return (
    <div className="flex-1 flex flex-col overflow-hidden reader-content">
      {showToolbar && (
        <div className="flex justify-between items-center p-3 border-b border-border w-full bg-background z-10">
          <div className="flex items-center space-x-2">
            {/* Sidebar Toggle Button */}
            <button className="p-2 rounded-md hover:bg-accent" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </button>

            {/* Font Size Controls */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <button className="p-2 hover:bg-accent border-r" onClick={decreaseFont}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-2 text-sm">{fontSize}px</span>
              <button className="p-2 hover:bg-accent border-l" onClick={increaseFont}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Edit Button */}
            <button
              className={cn("p-2 rounded-md hover:bg-accent", isEditing && "bg-accent")}
              onClick={() => {
                if (isEditing) {
                  // Save the edited content
                  if (currentDocument) {
                    setDocuments((prev) =>
                      prev.map((doc) =>
                        doc.id === currentDocument.id
                          ? { ...doc, content: editContent, lastModified: new Date() }
                          : doc,
                      ),
                    )
                    toast({
                      title: "Document saved",
                      description: "Your changes have been saved",
                    })
                  }
                  setIsEditing(false)
                } else {
                  // Enter edit mode
                  if (currentDocument) {
                    setEditContent(currentDocument.content)
                    setIsEditing(true)
                    toast({
                      title: "Edit mode",
                      description: "You can now edit the document",
                    })
                  }
                }
              }}
              disabled={!currentDocument}
            >
              <Pencil className={cn("h-5 w-5", isEditing && "text-primary")} />
            </button>

            {/* Add Bookmark Button */}
            <button className="p-2 rounded-md hover:bg-accent" onClick={handleAddBookmark} disabled={!currentDocument}>
              <BookmarkPlus className="h-5 w-5" />
            </button>

            {/* Mobile Dropdown Menu */}
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-md hover:bg-accent">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleBookmarkPanel}>
                    <BookmarkList className="h-4 w-4 mr-2" />
                    View bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAiToolsInfoOpen(true)}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Tools
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguagePopoverOpen(!languagePopoverOpen)}>
                    <Globe className="h-4 w-4 mr-2" />
                    Language: {language.code}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsInfoOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* View Bookmarks Button */}
                <button
                  className={cn("p-2 rounded-md hover:bg-accent", bookmarkPanelOpen && "bg-accent")}
                  onClick={toggleBookmarkPanel}
                  disabled={!currentDocument}
                >
                  <BookmarkList className="h-5 w-5" />
                </button>

                {/* AI Tools Button */}
                <button
                  className={cn(
                    "p-2 rounded-md hover:bg-accent",
                    (summaryPanelOpen || rewritePanelOpen) && "bg-accent",
                  )}
                  onClick={() => setAiToolsInfoOpen(true)}
                >
                  <Wand2 className="h-5 w-5" />
                </button>

                {/* Language Button */}
                <button
                  className="p-2 rounded-md hover:bg-accent flex items-center gap-1"
                  onClick={() => setLanguagePopoverOpen(!languagePopoverOpen)}
                >
                  <Globe className="h-5 w-5" />
                  <span className="text-xs hidden sm:inline-block">{language.nativeName}</span>
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px] hidden sm:flex">
                    {language.code}
                  </Badge>
                </button>

                {/* Export Button */}
                <button className="p-2 rounded-md hover:bg-accent" onClick={handleExport}>
                  <Download className="h-5 w-5" />
                </button>

                {/* Settings Button */}
                <button className="p-2 rounded-md hover:bg-accent" onClick={() => setSettingsInfoOpen(true)}>
                  <Settings className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        className={cn(
          "flex-1 overflow-auto p-4 md:p-8 max-w-3xl mx-auto w-full relative",
          (summaryPanelOpen || rewritePanelOpen || bookmarkPanelOpen) && (isMobile ? "mb-64" : "mr-80"), // On mobile, panel appears at bottom
        )}
        onDoubleClick={() => !showToolbar && setShowToolbar(true)}
      >
        {/* Bookmark notification */}
        {showBookmarkNotification && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 bookmark-notification flex items-center space-x-2 max-w-[90vw]">
            <BookmarkPlus className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">{notificationMessage}</span>
          </div>
        )}

        {/* Bookmark position indicators */}
        <div className="absolute right-0 top-0 bottom-0 w-2 z-10">{currentDocument && renderBookmarkIndicators()}</div>

        {/* Rest of the content */}
        {!showToolbar && (
          <button
            className="absolute top-2 right-2 p-2 rounded-md opacity-0 hover:opacity-100 transition-opacity hover:bg-accent"
            onClick={() => setShowToolbar(true)}
          >
            <Settings className="h-5 w-5" />
          </button>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading document...</p>
          </div>
        ) : currentDocument ? (
          <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none fade-in">
            {/* Only render the title if it's not already in the content */}
            {!currentDocument.content.startsWith(`# ${currentDocument.name}`) && (
              <h1 className="text-3xl font-bold mb-8">{currentDocument.name}</h1>
            )}

            {/* Render content */}
            {currentDocument.content ? (
              isEditing ? (
                <div className="relative">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[calc(100vh-200px)] font-mono text-base resize-none p-4"
                    placeholder="Start writing..."
                  />
                  <button
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                    onClick={() => {
                      if (currentDocument) {
                        setDocuments((prev) =>
                          prev.map((doc) =>
                            doc.id === currentDocument.id
                              ? { ...doc, content: editContent, lastModified: new Date() }
                              : doc,
                          ),
                        )
                        setIsEditing(false)
                        toast({
                          title: "Document saved",
                          description: "Your changes have been saved",
                        })
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                </div>
              ) : (
                <SimpleMarkdownRenderer
                  content={currentDocument.content}
                  fontSize={fontSize}
                  bookmarks={getDocumentBookmarks(currentDocument.id)}
                />
              )
            ) : (
              <p className="text-muted-foreground">This document appears to be empty.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">Select a document or create a new one to get started</p>
            <p className="text-sm text-muted-foreground/70">Your documents will appear in the sidebar</p>
          </div>
        )}
      </div>

      {/* Bookmark Dialog */}
      <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookmark-name" className="text-right">
                Name
              </Label>
              <Input
                id="bookmark-name"
                value={bookmarkName}
                onChange={(e) => setBookmarkName(e.target.value)}
                className="col-span-3"
                placeholder="Bookmark name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookmark-note" className="text-right">
                Note
              </Label>
              <Textarea
                id="bookmark-note"
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                className="col-span-3"
                placeholder="Add a note (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookmarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBookmark}>Save Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Popover */}
      {languagePopoverOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setLanguagePopoverOpen(false)}>
          <div
            className="absolute right-4 top-16 w-[200px] bg-popover border rounded-md shadow-md p-0 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b">
              <Input
                placeholder="Search language..."
                className="h-8"
                onChange={(e) => {
                  // Add language search functionality
                  const searchTerm = e.target.value.toLowerCase()
                  // You would filter languages here based on the search term
                }}
              />
            </div>
            <div className="max-h-[300px] overflow-auto py-1">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setLanguage(lang)
                    setLanguagePopoverOpen(false)
                    toast({
                      title: "System language changed",
                      description: `All AI responses will now be in ${lang.name}`,
                    })
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", language.code === lang.code ? "opacity-100" : "opacity-0")} />
                  <span>{lang.nativeName}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {lang.code}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Tools Info Dialog */}
      <Dialog open={aiToolsInfoOpen} onOpenChange={setAiToolsInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Document Tools</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <AlignJustify className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-medium">Summarize Document</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Creates a concise summary of your document, extracting key points and main ideas. Choose between brief,
                medium, or detailed summaries.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-medium">Rewrite Document</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Rewrites your document in different styles: simple, academic, professional, or concise. Improves clarity
                while preserving the original meaning.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setAiToolsInfoOpen(false)}>
              Cancel
            </Button>
            <div className="space-x-2">
              <Button
                onClick={() => {
                  setAiToolsInfoOpen(false)
                  toggleSummaryPanel()
                }}
              >
                Summarize
              </Button>
              <Button
                onClick={() => {
                  setAiToolsInfoOpen(false)
                  toggleRewritePanel()
                }}
              >
                Rewrite
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Info Dialog */}
      <Dialog open={settingsInfoOpen} onOpenChange={setSettingsInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Theme Options</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setTheme("light")
                    setSettingsInfoOpen(false)
                  }}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setTheme("sepia")
                    setSettingsInfoOpen(false)
                  }}
                >
                  <Sun className="h-4 w-4 mr-2 opacity-70" />
                  Sepia
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setTheme("dark")
                    setSettingsInfoOpen(false)
                  }}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setTheme("night")
                    setSettingsInfoOpen(false)
                  }}
                >
                  <Moon className="h-4 w-4 mr-2 opacity-70" />
                  Night
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Choose a theme that's comfortable for your eyes. Dark themes are great for low-light environments.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Interface Options</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowToolbar(false)
                  setSettingsInfoOpen(false)
                }}
              >
                <span>Hide toolbar</span>
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Hide the toolbar for a distraction-free reading experience. Double-click anywhere to show it again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsInfoOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Panel */}
      <SummaryPanel isOpen={summaryPanelOpen} onClose={() => setSummaryPanelOpen(false)} />

      {/* Rewrite Document Panel */}
      <RewriteDocumentPanel isOpen={rewritePanelOpen} onClose={() => setRewriteDocumentPanelOpen(false)} />

      {/* Bookmark Panel */}
      <BookmarkPanel
        isOpen={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
        onJumpToBookmark={handleJumpToBookmark}
      />
    </div>
  )
}

