"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FileText, Star, Users, Trash2, Plus, Menu } from "lucide-react"

interface MobileDrawerProps {
  onNewDocument: () => void
}

export function MobileDrawer({ onNewDocument }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleNewDocument = () => {
    onNewDocument()
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Docs Home</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button
            className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleNewDocument}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>

          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Recent
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <Star className="h-4 w-4 mr-2" />
              Starred
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4 mr-2" />
              Shared with me
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Trash
            </Button>
          </nav>

          <div className="pt-4 border-t border-border">
            <h3 className="font-medium text-foreground mb-2">Table of Contents</h3>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              <div className="text-foreground hover:text-primary cursor-pointer py-1" onClick={() => setIsOpen(false)}>
                Introduction
              </div>
              <div
                className="text-foreground hover:text-primary cursor-pointer py-1 pl-4"
                onClick={() => setIsOpen(false)}
              >
                Overview
              </div>
              <div className="text-foreground hover:text-primary cursor-pointer py-1" onClick={() => setIsOpen(false)}>
                Main Content
              </div>
              <div className="text-foreground hover:text-primary cursor-pointer py-1" onClick={() => setIsOpen(false)}>
                Conclusion
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
