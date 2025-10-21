"use client"

import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Users, MessageSquare, Share2, Zap } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground">DocWave</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/documents">
              <Button variant="ghost">Documents</Button>
            </Link>
            <Link href="/editor">
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground text-balance">
            Collaborative Rich-Text Editor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Create, edit, and collaborate on documents in real-time with your team. Built with modern web technologies.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/editor">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Editing
              </Button>
            </Link>
            <Link href="/documents">
              <Button size="lg" variant="outline">
                View Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <Users className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Real-time Collaboration</h3>
            <p className="text-muted-foreground">
              See other users&apos; cursors and selections as they edit. Work together seamlessly.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Comments & Suggestions</h3>
            <p className="text-muted-foreground">
              Leave threaded comments and track changes with suggestion mode for better feedback.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <Share2 className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Easy Sharing</h3>
            <p className="text-muted-foreground">
              Share documents with custom permissions. Control who can view, comment, or edit.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Rich Formatting</h3>
            <p className="text-muted-foreground">
              Support for headings, lists, code blocks, quotes, and more. Type &quot;/&quot; for commands.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <FileText className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Document Management</h3>
            <p className="text-muted-foreground">
              Organize documents with favorites, recent files, and trash. Search across all documents.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Auto-save</h3>
            <p className="text-muted-foreground">
              Your work is automatically saved. See sync status and never lose your changes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-primary rounded-lg p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to collaborate?</h2>
          <p className="text-primary-foreground/90 text-lg">
            Start creating and sharing documents with your team today.
          </p>
          <Link href="/editor">
            <Button size="lg" variant="secondary">
              Create Your First Document
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2025 DocWave. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
