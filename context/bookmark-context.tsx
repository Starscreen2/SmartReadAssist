"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Bookmark = {
  id: string
  documentId: string
  position: string // Element ID or text snippet to locate position
  name: string
  timestamp: Date
  note?: string
}

type BookmarkContextType = {
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, "id" | "timestamp">) => void
  removeBookmark: (id: string) => void
  updateBookmark: (id: string, updates: Partial<Omit<Bookmark, "id">>) => void
  getDocumentBookmarks: (documentId: string) => Bookmark[]
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined)

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  // Load bookmarks from localStorage on initial render
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("bookmarks")
      if (savedBookmarks) {
        const parsedBookmarks = JSON.parse(savedBookmarks)
        const bookmarksWithDates = parsedBookmarks.map((bookmark: any) => ({
          ...bookmark,
          timestamp: new Date(bookmark.timestamp),
        }))
        setBookmarks(bookmarksWithDates)
      }
    } catch (e) {
      console.error("Failed to load saved bookmarks:", e)
    }
  }, [])

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
    } catch (e) {
      console.error("Failed to save bookmarks:", e)
    }
  }, [bookmarks])

  const addBookmark = (bookmark: Omit<Bookmark, "id" | "timestamp">) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setBookmarks((prev) => [...prev, newBookmark])
  }

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
  }

  const updateBookmark = (id: string, updates: Partial<Omit<Bookmark, "id">>) => {
    setBookmarks((prev) => prev.map((bookmark) => (bookmark.id === id ? { ...bookmark, ...updates } : bookmark)))
  }

  const getDocumentBookmarks = (documentId: string) => {
    return bookmarks.filter((bookmark) => bookmark.documentId === documentId)
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        updateBookmark,
        getDocumentBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarkProvider")
  }
  return context
}

