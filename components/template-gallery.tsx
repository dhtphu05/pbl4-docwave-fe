"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useDocuments } from "./document-provider"
import { FileText, Users, BarChart3, FileCheck, Calendar, Briefcase } from "lucide-react"

interface Template {
  id: string
  title: string
  description: string
  category: "meeting" | "planning" | "report" | "form" | "project"
  icon: React.ComponentType<{ className?: string }>
  preview: string
  tags: string[]
  content: TemplateBlock[]
}

type TemplateBlock = {
  id: string
  type:
    | "paragraph"
    | "heading1"
    | "heading2"
    | "heading3"
    | "quote"
    | "code"
    | "bulletList"
    | "numberedList"
    | "checklist"
    | "divider"
  content: string
  checked?: boolean
}

const templates: Template[] = [
  {
    id: "meeting-notes",
    title: "Meeting Notes",
    description: "Structured template for capturing meeting discussions, decisions, and action items.",
    category: "meeting",
    icon: Users,
    preview: "Meeting with agenda, attendees, notes, and action items sections.",
    tags: ["meeting", "notes", "agenda"],
    content: [
      { id: "1", type: "heading1", content: "Meeting Notes - [Date]" },
      { id: "2", type: "heading2", content: "Meeting Details" },
      { id: "3", type: "bulletList", content: "Date: [Insert Date]" },
      { id: "4", type: "bulletList", content: "Time: [Insert Time]" },
      { id: "5", type: "bulletList", content: "Location: [Insert Location]" },
      { id: "6", type: "heading2", content: "Attendees" },
      { id: "7", type: "bulletList", content: "[Name] - [Role]" },
      { id: "8", type: "bulletList", content: "[Name] - [Role]" },
      { id: "9", type: "heading2", content: "Agenda" },
      { id: "10", type: "numberedList", content: "[Agenda Item 1]" },
      { id: "11", type: "numberedList", content: "[Agenda Item 2]" },
      { id: "12", type: "heading2", content: "Discussion Notes" },
      { id: "13", type: "paragraph", content: "[Key discussion points and decisions made]" },
      { id: "14", type: "heading2", content: "Action Items" },
      { id: "15", type: "checklist", content: "[Action item] - Assigned to: [Name] - Due: [Date]", checked: false },
      { id: "16", type: "checklist", content: "[Action item] - Assigned to: [Name] - Due: [Date]", checked: false },
    ],
  },
  {
    id: "project-plan",
    title: "Project Plan",
    description: "Comprehensive project planning template with objectives, timeline, and deliverables.",
    category: "planning",
    icon: Briefcase,
    preview: "Project overview, objectives, timeline, resources, and risk assessment.",
    tags: ["project", "planning", "timeline"],
    content: [
      { id: "1", type: "heading1", content: "Project Plan: [Project Name]" },
      { id: "2", type: "heading2", content: "Project Overview" },
      { id: "3", type: "paragraph", content: "[Brief description of the project and its purpose]" },
      { id: "4", type: "heading2", content: "Objectives" },
      { id: "5", type: "bulletList", content: "[Primary objective]" },
      { id: "6", type: "bulletList", content: "[Secondary objective]" },
      { id: "7", type: "heading2", content: "Timeline" },
      { id: "8", type: "paragraph", content: "Project Start Date: [Date]" },
      { id: "9", type: "paragraph", content: "Project End Date: [Date]" },
      { id: "10", type: "heading2", content: "Key Milestones" },
      { id: "11", type: "checklist", content: "[Milestone 1] - Due: [Date]", checked: false },
      { id: "12", type: "checklist", content: "[Milestone 2] - Due: [Date]", checked: false },
      { id: "13", type: "heading2", content: "Resources Required" },
      { id: "14", type: "bulletList", content: "Team members: [List]" },
      { id: "15", type: "bulletList", content: "Budget: [Amount]" },
      { id: "16", type: "bulletList", content: "Tools/Software: [List]" },
    ],
  },
  {
    id: "status-report",
    title: "Status Report",
    description: "Weekly or monthly status report template for project updates and progress tracking.",
    category: "report",
    icon: BarChart3,
    preview: "Progress summary, achievements, challenges, and next steps.",
    tags: ["report", "status", "progress"],
    content: [
      { id: "1", type: "heading1", content: "Status Report - [Period]" },
      { id: "2", type: "heading2", content: "Executive Summary" },
      { id: "3", type: "paragraph", content: "[Brief overview of current status and key highlights]" },
      { id: "4", type: "heading2", content: "Progress This Period" },
      { id: "5", type: "bulletList", content: "[Achievement 1]" },
      { id: "6", type: "bulletList", content: "[Achievement 2]" },
      { id: "7", type: "heading2", content: "Key Metrics" },
      { id: "8", type: "bulletList", content: "[Metric]: [Value] ([Change from last period])" },
      { id: "9", type: "bulletList", content: "[Metric]: [Value] ([Change from last period])" },
      { id: "10", type: "heading2", content: "Challenges & Risks" },
      { id: "11", type: "bulletList", content: "[Challenge/Risk 1] - Mitigation: [Action]" },
      { id: "12", type: "heading2", content: "Next Steps" },
      { id: "13", type: "checklist", content: "[Next action] - Due: [Date]", checked: false },
      { id: "14", type: "checklist", content: "[Next action] - Due: [Date]", checked: false },
    ],
  },
  {
    id: "feedback-form",
    title: "Feedback Form",
    description: "Structured feedback collection template for surveys, reviews, and evaluations.",
    category: "form",
    icon: FileCheck,
    preview: "Rating scales, open-ended questions, and feedback categories.",
    tags: ["feedback", "form", "survey"],
    content: [
      { id: "1", type: "heading1", content: "Feedback Form" },
      {
        id: "2",
        type: "paragraph",
        content: "Thank you for taking the time to provide your feedback. Your input is valuable to us.",
      },
      { id: "3", type: "heading2", content: "General Information" },
      { id: "4", type: "paragraph", content: "Name: _______________" },
      { id: "5", type: "paragraph", content: "Date: _______________" },
      { id: "6", type: "paragraph", content: "Department/Role: _______________" },
      { id: "7", type: "heading2", content: "Overall Satisfaction" },
      { id: "8", type: "paragraph", content: "Rate your overall experience: ⭐ ⭐ ⭐ ⭐ ⭐" },
      { id: "9", type: "heading2", content: "Specific Feedback" },
      { id: "10", type: "paragraph", content: "What did you like most?" },
      { id: "11", type: "paragraph", content: "[Your response here]" },
      { id: "12", type: "paragraph", content: "What could be improved?" },
      { id: "13", type: "paragraph", content: "[Your response here]" },
      { id: "14", type: "heading2", content: "Additional Comments" },
      { id: "15", type: "paragraph", content: "[Any additional feedback or suggestions]" },
    ],
  },
]

interface TemplateGalleryProps {
  children: React.ReactNode
}

export function TemplateGallery({ children }: TemplateGalleryProps) {
  const { createDocument } = useDocuments()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = [
    { id: "all", label: "All Templates", icon: FileText },
    { id: "meeting", label: "Meeting", icon: Users },
    { id: "planning", label: "Planning", icon: Calendar },
    { id: "report", label: "Reports", icon: BarChart3 },
    { id: "form", label: "Forms", icon: FileCheck },
    { id: "project", label: "Projects", icon: Briefcase },
  ]

  const filteredTemplates =
    selectedCategory === "all" ? templates : templates.filter((template) => template.category === selectedCategory)

  const handleUseTemplate = (template: Template) => {
    createDocument(template.title)
    // In a real app, this would set the document content to the template content
    console.log("Creating document from template:", template.title)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Choose a Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[60vh]">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-border pr-4">
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer group"
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">{template.preview}</div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length === 1 ? "" : "s"} available
          </p>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
