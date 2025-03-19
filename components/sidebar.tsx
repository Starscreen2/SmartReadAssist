"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  PlusCircle,
  File,
  Trash2,
  Edit,
  FolderPlus,
  FileText,
  ChevronLeft,
  Search,
  X,
  BookOpen,
  Bookmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { processDocument } from "@/app/actions/document-processor"
import { useDocuments } from "@/context/document-context"
import { useBookmarks } from "@/context/bookmark-context"
import { useSidebar } from "@/context/sidebar-context"
import { useToast } from "@/hooks/use-toast"
import { DOCXUploadProcessor } from "./docx-upload-processor"
import { cn } from "@/lib/utils"

type Document = {
  id: string
  name: string
  content: string
  lastModified: Date
}

export function Sidebar() {
  const { documents, setDocuments, selectedDocument, setSelectedDocument } = useDocuments()
  const { getDocumentBookmarks } = useBookmarks()
  const { isExpanded, toggleSidebar } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [newDocumentName, setNewDocumentName] = useState("")
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { toast } = useToast()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newDocDialogOpen, setNewDocDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDocumentSelect = (id: string) => {
    console.log("Selecting document:", id)
    setSelectedDocument(id)
    // Add a toast notification for feedback
    const doc = documents.find((d) => d.id === id)
    if (doc) {
      toast({
        title: "Document selected",
        description: `Now viewing: ${doc.name}`,
      })
    }
  }

  const handleCreateDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: newDocumentName || "Untitled Document",
      content: `# ${newDocumentName || "Untitled Document"}

Start writing your document here...`,
      lastModified: new Date(),
    }
    setDocuments([...documents, newDoc])
    setNewDocumentName("")
    setSelectedDocument(newDoc.id)

    // Add this line to store editing state in localStorage
    localStorage.setItem("document-editing-mode", "true")

    setNewDocDialogOpen(false)

    toast({
      title: "Document created",
      description: `${newDoc.name} has been created and is ready for editing.`,
    })
  }

  const handleDeleteDocument = (id: string) => {
    const docToDelete = documents.find((doc) => doc.id === id)
    setDocuments(documents.filter((doc) => doc.id !== id))
    if (selectedDocument === id) {
      setSelectedDocument(documents.length > 1 ? documents[0].id : null)
    }

    if (docToDelete) {
      toast({
        title: "Document deleted",
        description: `${docToDelete.name} has been deleted.`,
      })
    }
  }

  const handleRenameDocument = (id: string) => {
    if (!newName.trim()) {
      toast({
        title: "Invalid name",
        description: "Document name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc)))
    setIsRenaming(null)
    setNewName("")

    toast({
      title: "Document renamed",
      description: `Document has been renamed to ${newName}.`,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // If it's a PDF or DOCX, close the dialog and let the user use the specific processor
    if (file.type === "application/pdf") {
      toast({
        title: "PDF detected",
        description: "Please use the PDF processor tab for better results.",
      })
      return
    }

    if (file.name.endsWith(".docx")) {
      toast({
        title: "DOCX detected",
        description: "Please use the DOCX processor tab for better results.",
      })
      return
    }

    // Show loading toast
    toast({
      title: "Uploading document",
      description: `Processing ${file.name}...`,
    })

    // Create a FormData object to send the file
    const formData = new FormData()
    formData.append("file", file)

    try {
      // Process the document
      const processedDoc = await processDocument(formData)

      if (processedDoc) {
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          content: processedDoc.content,
          lastModified: new Date(),
        }

        console.log("Adding new document:", newDoc)

        setDocuments((prev) => {
          const updated = [...prev, newDoc]
          console.log("Updated documents:", updated)
          return updated
        })

        setSelectedDocument(newDoc.id)

        // Show success toast
        toast({
          title: "Document uploaded",
          description: `${file.name} has been added to your documents.`,
        })
      } else {
        // Handle error
        toast({
          title: "Upload failed",
          description: "Failed to process document. Please try a different file.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload error",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      })
    }

    // Reset the file input
    e.target.value = ""
    setUploadDialogOpen(false)
  }

  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-full flex flex-col bg-sidebar sidebar-transition border-r border-border",
          isExpanded ? "w-64" : "w-16",
        )}
      >
        <div
          className={cn(
            "border-b flex items-center transition-all bg-sidebar h-[61px]",
            isExpanded ? "justify-between p-3" : "justify-center p-3",
          )}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-base font-semibold">Smart Reader</h2>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Collapse sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Collapse sidebar</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={toggleSidebar} className="h-10 w-10 p-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="sr-only">Expand sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand sidebar</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {isExpanded ? (
          <>
            <div className="p-4">
              <div className="mb-4 relative">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-opacity",
                    isSearchFocused || searchQuery ? "opacity-0" : "opacity-70",
                  )}
                >
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  ref={searchInputRef}
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn("w-full transition-all", isSearchFocused || searchQuery ? "pl-3 pr-8" : "pl-9")}
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 opacity-70 hover:opacity-100" />
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <Dialog open={newDocDialogOpen} onOpenChange={setNewDocDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Document</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newDocumentName}
                          onChange={(e) => setNewDocumentName(e.target.value)}
                          className="col-span-3"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreateDocument()
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateDocument}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="regular">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="regular">Text Files</TabsTrigger>
                        <TabsTrigger value="docx">DOCX Files</TabsTrigger>
                      </TabsList>
                      <TabsContent value="regular" className="py-4">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Upload text files, Markdown, or other supported formats.
                          </p>
                          <div className="relative">
                            <input
                              type="file"
                              id="file-upload"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleFileUpload}
                              accept=".txt,.md"
                            />
                            <Button variant="outline" className="w-full">
                              <FileText className="h-4 w-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="docx" className="py-4">
                        <DOCXUploadProcessor />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-muted-foreground">Your Documents</h3>
                <span className="text-xs text-muted-foreground">
                  {documents.length} {documents.length === 1 ? "document" : "documents"}
                </span>
              </div>
              <div className="space-y-1">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="group relative">
                      {isRenaming === doc.id ? (
                        <div className="flex items-center p-2 bg-accent/50 rounded-md">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameDocument(doc.id)
                              } else if (e.key === "Escape") {
                                setIsRenaming(null)
                                setNewName("")
                              }
                            }}
                            className="h-7"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRenameDocument(doc.id)}
                            className="ml-2 h-7 w-7 p-0"
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors",
                            selectedDocument === doc.id ? "bg-accent/70" : "",
                          )}
                        >
                          <div
                            className={`flex items-center flex-1 min-w-0 mr-2 ${selectedDocument === doc.id ? "font-medium" : ""}`}
                            onClick={() => handleDocumentSelect(doc.id)}
                          >
                            <File
                              className={cn(
                                "h-4 w-4 mr-2 flex-shrink-0",
                                selectedDocument === doc.id ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <Tooltip delayDuration={500}>
                              <TooltipTrigger asChild>
                                <span className="truncate min-w-0 flex-1">{doc.name}</span>
                              </TooltipTrigger>
                              <TooltipContent side="right" align="start">
                                <p>{doc.name}</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* Show bookmark count if document has bookmarks */}
                            {getDocumentBookmarks(doc.id).length > 0 && (
                              <div className="ml-2 flex items-center text-xs bg-primary/10 text-primary px-1.5 rounded-full flex-shrink-0">
                                <Bookmark className="h-3 w-3 mr-0.5" />
                                <span>{getDocumentBookmarks(doc.id).length}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsRenaming(doc.id)
                                setNewName(doc.name)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDocument(doc.id)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="mb-2">No documents found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="mb-2">No documents yet</p>
                    <p className="text-sm">Create a new document to get started</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center pt-4 overflow-hidden">
            <div className="grid grid-cols-1 gap-2 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 mx-auto"
                    onClick={() => {
                      toggleSidebar()
                      setTimeout(() => {
                        setNewDocDialogOpen(true)
                      }, 300)
                    }}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>New Document</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 mx-auto"
                    onClick={() => {
                      toggleSidebar()
                      setTimeout(() => {
                        setUploadDialogOpen(true)
                      }, 300)
                    }}
                  >
                    <FolderPlus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Upload Document</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 mx-auto"
                    onClick={() => {
                      toggleSidebar()
                      setTimeout(focusSearch, 300)
                    }}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Search Documents</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {filteredDocuments.length > 0 && (
              <div className="mt-6 w-full px-2">
                <div className="grid grid-cols-1 gap-2 w-full">
                  {filteredDocuments.slice(0, 8).map((doc) => (
                    <Tooltip key={doc.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 mx-auto relative",
                            selectedDocument === doc.id ? "bg-accent text-accent-foreground" : "",
                          )}
                          onClick={() => handleDocumentSelect(doc.id)}
                        >
                          <File className="h-5 w-5" />
                          {/* Show bookmark indicator on icon */}
                          {getDocumentBookmarks(doc.id).length > 0 && (
                            <div className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                              {getDocumentBookmarks(doc.id).length}
                            </div>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{doc.name}</p>
                        {getDocumentBookmarks(doc.id).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {getDocumentBookmarks(doc.id).length} bookmark
                            {getDocumentBookmarks(doc.id).length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {filteredDocuments.length > 8 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 mx-auto" onClick={toggleSidebar}>
                          <div className="text-xs font-medium">+{filteredDocuments.length - 8}</div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Show all documents</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

