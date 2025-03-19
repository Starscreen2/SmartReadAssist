"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface RewrittenContentProps {
  content: string
  fontSize?: number
}

export function RewrittenContent({ content, fontSize = 14 }: RewrittenContentProps) {
  // Process the content to remove any code block formatting
  const processContent = (text: string): string => {
    // Remove any triple backtick code blocks
    let processed = text.replace(/```[\s\S]*?```/g, (match) => {
      // Remove the backticks but keep the content
      return match.replace(/```(?:.*?)\n?|\n?```/g, "")
    })

    // Remove any indentation that might be interpreted as code blocks
    processed = processed.replace(/^( {4,}|\t+)(.+)$/gm, "$2")

    return processed
  }

  const processedContent = processContent(content)

  return (
    <div className="bg-background text-foreground rounded-md" style={{ fontSize: `${fontSize}px` }}>
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
            return inline ? (
              <code className="bg-muted text-foreground rounded px-1 py-0.5" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-muted text-foreground p-4 rounded-lg my-4 overflow-x-auto">
                <code {...props}>{children}</code>
              </pre>
            )
          },
          pre: ({ node, ...props }) => (
            <div className="bg-muted text-foreground p-4 rounded-lg my-4 overflow-x-auto" {...props} />
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
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

