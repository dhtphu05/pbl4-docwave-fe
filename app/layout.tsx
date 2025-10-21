import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { geist, geistMono } from "./font"
import { AppProviders } from "@/providers/app-providers"

export const metadata: Metadata = {
  title: "DocWave - Collaborative Rich Text Editor",
  description: "Modern collaborative rich-text editor with real-time collaboration",
  generator: "v0.app",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans">
        <Suspense fallback={null}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
