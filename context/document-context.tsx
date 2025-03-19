"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Document = {
  id: string
  name: string
  content: string
  lastModified: Date
}

type DocumentContextType = {
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  selectedDocument: string | null
  setSelectedDocument: React.Dispatch<React.SetStateAction<string | null>>
  currentDocument: Document | null
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Introduction to AI",
      content: `# Introduction to Artificial Intelligence

Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning (the acquisition of information and rules for using the information), reasoning (using rules to reach approximate or definite conclusions), and self-correction.

## History of AI

The term "artificial intelligence" was coined in 1956, but AI has become more popular today thanks to increased data volumes, advanced algorithms, and improvements in computing power and storage.

Early AI research in the 1950s explored topics like problem solving and symbolic methods. In the 1960s, the US Department of Defense took interest in this type of work and began training computers to mimic basic human reasoning.

## Types of AI

AI can be categorized in many ways, but here are the two most common:

1. **Narrow AI**: AI that is designed to perform a narrow task (e.g. facial recognition, internet searches, driving a car).
2. **General AI**: AI systems that can perform any intellectual task that a human being can do.

## Applications of AI

AI is being applied across different industries:

- **Healthcare**: AI applications can provide personalized medicine and X-ray readings.
- **Retail**: AI provides virtual shopping capabilities that offer personalized recommendations.
- **Manufacturing**: AI can analyze factory IoT data as it streams from connected equipment to forecast expected load and demand.`,
      lastModified: new Date(),
    },
    // ... other initial documents
  ])

  const [selectedDocument, setSelectedDocument] = useState<string | null>("1")
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)

  // Update current document when selected document changes
  useEffect(() => {
    console.log("Document selection changed:", selectedDocument)
    if (selectedDocument) {
      const doc = documents.find((d) => d.id === selectedDocument)
      console.log("Found document:", doc)
      setCurrentDocument(doc || null)
    } else {
      setCurrentDocument(null)
    }
  }, [selectedDocument, documents])

  // Load documents from localStorage on initial render
  useEffect(() => {
    const loadSavedDocuments = () => {
      try {
        const savedDocs = localStorage.getItem("documents")
        const savedSelectedDoc = localStorage.getItem("selectedDocument")

        if (savedDocs) {
          const parsedDocs = JSON.parse(savedDocs)
          const docsWithDates = parsedDocs.map((doc: any) => ({
            ...doc,
            lastModified: new Date(doc.lastModified),
          }))
          setDocuments(docsWithDates)
        }

        if (savedSelectedDoc) {
          setSelectedDocument(savedSelectedDoc)
        }
      } catch (e) {
        console.error("Failed to load saved documents:", e)
      }
    }

    loadSavedDocuments()
  }, [])

  // Save documents to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("documents", JSON.stringify(documents))
    } catch (e) {
      console.error("Failed to save documents:", e)
    }
  }, [documents])

  // Save selected document to localStorage when it changes
  useEffect(() => {
    try {
      if (selectedDocument) {
        localStorage.setItem("selectedDocument", selectedDocument)
      }
    } catch (e) {
      console.error("Failed to save selected document:", e)
    }
  }, [selectedDocument])

  return (
    <DocumentContext.Provider
      value={{
        documents,
        setDocuments,
        selectedDocument,
        setSelectedDocument,
        currentDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider")
  }
  return context
}

