A modern document reading application with AI-powered assistance for enhanced comprehension and productivity.

Here is the website:
https://smart-read-assist.vercel.app/

## Overview

Smart Read Assistant is a web application that helps users read, manage, and interact with their documents more effectively. It combines a clean reading interface with AI-powered tools to summarize, explain, and rewrite content.

## Key Features

- **Document Management**: Upload, create, edit, and organize text documents and DOCX files
- **Distraction-Free Reading**: Clean, customizable reading interface with adjustable font sizes and themes
- **AI Assistant**: Ask questions about your document and get contextual answers
- **Text Highlighting**: Select text to get instant AI-powered explanations

## Document Tools**:

- Generate summaries of varying lengths (brief, medium, detailed)
- Rewrite documents in different styles (simple, academic, professional, concise)



- **Bookmarking**: Save and organize important sections of documents
- **Search**: Quickly find documents in your library


## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **AI Integration**: Google Gemini API for text generation and comprehension
- **Document Processing**: Markdown rendering, DOCX extraction


## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables:

1. `GEMINI_API_KEY`: Your Google Gemini API key



4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser


## Usage

- **Create Documents**: Click "New" in the sidebar to create a new document
- **Upload Documents**: Use the "Upload" button to add existing documents
- **Read & Edit**: Select a document to view it, and use the edit button to make changes
- **AI Features**:

- Click the AI Assistant button in the bottom right to ask questions
- Highlight text to get instant explanations
- Use the AI Tools menu to summarize or rewrite documents



- **Bookmarks**: Add bookmarks to save important sections for quick reference


## Project Structure

- `/app`: Next.js app router and page components
- `/components`: React components including document reader, sidebar, and AI assistant
- `/context`: React context providers for documents, bookmarks, and UI state
- `/lib`: Utility functions and document processing logic
- `/public`: Static assets


## Future Enhancements

- PDF support with text extraction
- Collaborative editing and sharing
- Advanced search with content indexing
- Mobile application


## License

MIT

