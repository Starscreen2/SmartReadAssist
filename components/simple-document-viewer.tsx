"use client"
import { useDocuments } from "@/context/document-context"

export function SimpleDocumentViewer() {
  const { currentDocument } = useDocuments()

  if (!currentDocument) {
    return (
      <div className="p-4 text-center">
        <p>No document selected</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{currentDocument.name}</h1>
      <div className="whitespace-pre-wrap">{currentDocument.content}</div>
    </div>
  )
}

