"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { DocumentProvider } from "@/components/document-provider"
import { CollaborationProvider } from "@/components/collaboration-provider"
import { CommentsProvider } from "@/components/comments-provider"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <DocumentProvider>
        <CollaborationProvider>
          <CommentsProvider>{children}</CommentsProvider>
        </CollaborationProvider>
      </DocumentProvider>
    </ThemeProvider>
  )
}
