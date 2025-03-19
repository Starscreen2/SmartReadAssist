"use client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useEffect, useState } from "react"

interface MarkdownRendererProps {
  content: string
  fontSize: number
  bookmarks?: Array<{
    position: string
    name: string
  }>
}

export function MarkdownRenderer({ content, fontSize, bookmarks = [] }: MarkdownRendererProps) {
  const [processedContent, setProcessedContent] = useState(content)
  const [highlightedContent, setHighlightedContent] = useState(content)

  // Process PDF content to improve formatting
  useEffect(() => {
    if (content && content.includes("Page")) {
      // Simple processing to improve PDF text formatting
      // Replace multiple newlines with markdown paragraph breaks
      let improved = content.replace(/\n{3,}/g, "\n\n")

      // Try to detect and format potential headings in the PDF text
      improved = improved.replace(/^([A-Z][A-Za-z\s]{2,50})$/gm, "## $1")

      setProcessedContent(improved)
    } else {
      setProcessedContent(content)
    }
  }, [content])

  // Highlight bookmarked text
  useEffect(() => {
    let contentWithHighlights = processedContent

    // Only process text bookmarks
    const textBookmarks = bookmarks.filter((b) => b.position.startsWith("text:"))

    if (textBookmarks.length > 0) {
      // Sort bookmarks by position in reverse order to avoid index shifting
      const sortedBookmarks = textBookmarks
        .map((b) => ({
          text: b.position.split(":")[1],
          name: b.name,
        }))
        .sort((a, b) => {
          const indexA = processedContent.indexOf(a.text)
          const indexB = processedContent.indexOf(b.text)
          return indexB - indexA // Reverse order
        })

      // Apply highlights
      for (const bookmark of sortedBookmarks) {
        const index = contentWithHighlights.indexOf(bookmark.text)
        if (index !== -1) {
          const before = contentWithHighlights.substring(0, index)
          const after = contentWithHighlights.substring(index + bookmark.text.length)
          contentWithHighlights = `${before}**${bookmark.text}**${after}`
        }
      }
    }

    setHighlightedContent(contentWithHighlights)
  }, [processedContent, bookmarks])

  // Add a debug log to check the content
  console.log("Rendering markdown content:", highlightedContent)

  // If content is empty or undefined, show a message
  if (!highlightedContent || highlightedContent.trim() === "") {
    return (
      <div className="p-4 text-center">
        <p>No content to display. This document appears to be empty.</p>
      </div>
    )
  }

  // Use a simple div with dangerouslySetInnerHTML as a fallback if ReactMarkdown fails
  const renderFallback = () => {
    // Convert markdown to HTML (very basic conversion)
    const html = highlightedContent
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gm, "<em>$1</em>")
      .replace(/\n/gm, "<br />")

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div style={{ fontSize: `${fontSize}px` }} className="markdown-content">
      {/* First try with ReactMarkdown */}
      <div className="markdown-primary">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="my-3" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3" {...props} />,
            li: ({ node, ...props }) => <li className="my-1" {...props} />,
            a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3" {...props} />
            ),
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "")
              return !inline && match ? (
                <div className="bg-muted text-foreground border rounded-md p-4 my-4 overflow-x-auto">
                  <SyntaxHighlighter style={vs} language={match[1]} PreTag="div" {...props}>
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-muted text-foreground rounded px-1 py-0.5" {...props}>
                  {children}
                </code>
              )
            },
            pre: ({ node, ...props }) => (
              <pre className="bg-muted text-foreground p-4 rounded-lg my-4 overflow-x-auto" {...props} />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-300" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
            tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
            tr: ({ node, ...props }) => <tr {...props} />,
            th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-sm font-semibold" {...props} />,
            td: ({ node, ...props }) => <td className="px-3 py-2 text-sm" {...props} />,
          }}
        >
          {highlightedContent}
        </ReactMarkdown>
      </div>

      {/* Fallback rendering in case ReactMarkdown fails */}
      <div className="markdown-fallback hidden">{renderFallback()}</div>

      {/* Plain text fallback as a last resort */}
      <pre className="markdown-raw hidden whitespace-pre-wrap">{highlightedContent}</pre>
    </div>
  )
}

