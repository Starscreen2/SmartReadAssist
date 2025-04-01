import { Sidebar } from "@/components/sidebar"
import { DocumentReader } from "@/components/document-reader"
import { AIAssistant } from "@/components/ai-assistant"
import { DocumentProvider } from "@/context/document-context"
import { SidebarProvider } from "@/context/sidebar-context"
import { ThemeProvider } from "@/components/theme-provider"
import { BookmarkProvider } from "@/context/bookmark-context"
// Import the LanguageProvider
import { LanguageProvider } from "@/context/language-context"

export default function Home() {
  return (
    <ThemeProvider>
      <DocumentProvider>
        <BookmarkProvider>
          <LanguageProvider>
            <SidebarProvider>
              <div className="flex h-screen bg-background overflow-hidden border-box">
                <Sidebar />
                <main className="flex-1 overflow-hidden flex flex-col">
                  <DocumentReader />
                  <AIAssistant />
                </main>
              </div>
            </SidebarProvider>
          </LanguageProvider>
        </BookmarkProvider>
      </DocumentProvider>
    </ThemeProvider>
  )
}

