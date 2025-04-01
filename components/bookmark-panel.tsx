"use client"

import { useState } from "react"
import { X, Bookmark, Edit, Trash2, ChevronRight, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useBookmarks, type Bookmark as BookmarkType } from "@/context/bookmark-context"
import { useDocuments } from "@/context/document-context"
import { useMobile } from "@/hooks/use-mobile"

interface BookmarkPanelProps {
  isOpen: boolean
  onClose: () => void
  onJumpToBookmark: (bookmark: BookmarkType) => void
}

export function BookmarkPanel({ isOpen, onClose, onJumpToBookmark }: BookmarkPanelProps) {
  const { bookmarks, removeBookmark, updateBookmark, getDocumentBookmarks } = useBookmarks()
  const { currentDocument } = useDocuments()
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editNote, setEditNote] = useState("")
  const { toast } = useToast()
  const { isMobile } = useMobile()

  // Add a confirmation dialog for bookmark deletion
  // Around line 20-30, add a new state variable

  const [deletingBookmark, setDeletingBookmark] = useState<string | null>(null)

  // Get bookmarks for the current document
  const documentBookmarks = currentDocument ? getDocumentBookmarks(currentDocument.id) : []

  // Sort bookmarks by timestamp (newest first)
  const sortedBookmarks = [...documentBookmarks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  const handleEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark.id)
    setEditName(bookmark.name)
    setEditNote(bookmark.note || "")
  }

  const handleSaveEdit = (id: string) => {
    updateBookmark(id, {
      name: editName,
      note: editNote,
    })
    setEditingBookmark(null)

    toast({
      title: "Bookmark updated",
      description: "Your bookmark has been updated successfully.",
    })
  }

  // Then update the handleDeleteBookmark function
  // Around line 50-60

  const handleDeleteBookmark = (id: string) => {
    setDeletingBookmark(id)
  }

  const confirmDeleteBookmark = (id: string) => {
    removeBookmark(id)
    setDeletingBookmark(null)

    toast({
      title: "Bookmark deleted",
      description: "Your bookmark has been removed.",
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div
      className={cn(
        "fixed border-l border-border bg-background transition-all duration-300 ease-in-out overflow-hidden z-30",
        isOpen
          ? isMobile
            ? "bottom-0 left-0 right-0 h-[60vh] border-t border-l-0 rounded-t-xl"
            : "right-0 top-0 bottom-0 w-80 border-l"
          : isMobile
            ? "bottom-0 left-0 right-0 h-0 border-t border-l-0"
            : "right-[-320px] top-0 bottom-0 w-80 border-l",
      )}
    >
      <div className="flex flex-col h-full">
        {isMobile && (
          <div className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium flex items-center">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarks
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {sortedBookmarks.length > 0 ? (
            <div className="space-y-3">
              {sortedBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="border rounded-md p-3 bg-card">
                  {editingBookmark === bookmark.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Bookmark name"
                        className="w-full"
                      />
                      <Textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Add a note (optional)"
                        className="w-full h-20 resize-none"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingBookmark(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(bookmark.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{bookmark.name}</h4>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditBookmark(bookmark)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Also update the bookmark card to show when it was last updated
                      // Around line 100-150, in the bookmark card section */}

                      <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(bookmark.timestamp)}</span>
                        </div>
                        {bookmark.position.startsWith("scroll:") && (
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            <span>Position bookmark</span>
                          </div>
                        )}
                        {bookmark.position.startsWith("text:") && (
                          <div className="flex items-center">
                            <Bookmark className="h-3 w-3 mr-1" />
                            <span>Text selection</span>
                          </div>
                        )}
                      </div>

                      {bookmark.note && <p className="text-sm mt-2 text-muted-foreground">{bookmark.note}</p>}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-xs h-7"
                        onClick={() => onJumpToBookmark(bookmark)}
                      >
                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                        Jump to bookmark
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bookmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground/70">
                {currentDocument
                  ? "Click the bookmark icon in the document to save your reading position"
                  : "Select a document first to add bookmarks"}
              </p>
            </div>
          )}
        </div>
      </div>

      {deletingBookmark && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-4 max-w-xs w-full shadow-lg">
            <h3 className="font-medium mb-2">Delete Bookmark</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this bookmark? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingBookmark(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDeleteBookmark(deletingBookmark)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

