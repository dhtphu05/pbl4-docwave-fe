"use client"

import Link from "next/link"
import { Shield } from "lucide-react"
import { DocWaveEditor } from "@/components/docwave-editor"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"

type EditorShellProps = {
  docId?: string
}

export function EditorShell({ docId }: EditorShellProps) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6 rounded-3xl border border-border bg-background/80 backdrop-blur-xl p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Sign in to start editing</h1>
            <p className="text-muted-foreground">
              DocWave requires authentication so we can sync your documents and attribution in real time.
            </p>
          </div>
          <div className="space-y-3">
            <Button variant="link" asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <DocWaveEditor docId={docId} />
}
