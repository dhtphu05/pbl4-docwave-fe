"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useDocuments } from "./document-provider"
import { Share2, Copy, Mail, Link, Users, Shield, AlertTriangle, X } from "lucide-react"

interface ShareDialogProps {
  documentId: string
  children: React.ReactNode
}

export function ShareDialog({ documentId, children }: ShareDialogProps) {
  const { currentDocument, shareSettings, shareDocument, addCollaborator, removeCollaborator, updateCollaboratorRole } =
    useDocuments()

  const [isOpen, setIsOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"viewer" | "commenter" | "editor">("commenter")
  const [localSettings, setLocalSettings] = useState(shareSettings)
  const [publicLink] = useState(`https://docwave.app/doc/${documentId}`)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setInviteError(null)
    addCollaborator(currentDocument?.id ?? documentId, inviteEmail, inviteRole)
      .then(() => setInviteEmail(""))
      .catch((err) => setInviteError(err.message || "Không thể mời người dùng"))
  }

  const handleSaveSettings = () => {
    shareDocument(documentId, localSettings)
    setIsOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, show a toast notification
  }

  const collaborators = currentDocument?.permissions.filter((p) => p.role !== "owner") || []

  const formatName = (perm: (typeof collaborators)[number]) =>
    perm.name || perm.email || perm.userId || "Unknown"
  const formatEmail = (perm: (typeof collaborators)[number]) => perm.email || "No email"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share &quot;{currentDocument?.title}&quot;
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="people" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people">
              <Users className="h-4 w-4 mr-2" />
              People
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Shield className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-4">
            {/* Invite people */}
              <div className="space-y-3">
                <Label>Invite people</Label>
                {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value: "viewer" | "commenter" | "editor") => setInviteRole(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="commenter">Commenter</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>

            {/* Current collaborators */}
            <div className="space-y-3">
              <Label>People with access</Label>
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentDocument?.owner.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{currentDocument?.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{currentDocument?.owner.name}</div>
                      <div className="text-sm text-muted-foreground">Owner</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Owner</Badge>
                </div>

                {/* Collaborators */}
                {collaborators.map((permission) => (
                  <div key={permission.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={permission.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{formatName(permission).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{formatName(permission)}</div>
                        <div className="text-sm text-muted-foreground">{formatEmail(permission)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={permission.role}
                        onValueChange={(value: "viewer" | "commenter" | "editor") =>
                          updateCollaboratorRole(documentId, permission.userId, value)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(documentId, permission.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Public link sharing</Label>
                <Switch
                  checked={localSettings.isPublic}
                  onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, isPublic: checked }))}
                />
              </div>

              {localSettings.isPublic && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Input value={publicLink} readOnly className="flex-1" />
                    <Button variant="outline" onClick={() => copyToClipboard(publicLink)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow-comments"
                        checked={localSettings.allowComments}
                        onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, allowComments: checked }))}
                      />
                      <Label htmlFor="allow-comments">Allow comments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow-editing"
                        checked={localSettings.allowEditing}
                        onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, allowEditing: checked }))}
                      />
                      <Label htmlFor="allow-editing">Allow editing</Label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-800 dark:text-yellow-200">Public link active</div>
                      <div className="text-yellow-700 dark:text-yellow-300">
                        Anyone with this link can{" "}
                        {localSettings.allowEditing ? "edit" : localSettings.allowComments ? "comment on" : "view"} this
                        document.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require sign-in</Label>
                  <div className="text-sm text-muted-foreground">Viewers must sign in to access</div>
                </div>
                <Switch
                  checked={localSettings.requireSignIn}
                  onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, requireSignIn: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Link expiration</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="1day">1 day</SelectItem>
                    <SelectItem value="1week">1 week</SelectItem>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="custom">Custom date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password protection</Label>
                <Input
                  type="password"
                  placeholder="Optional password"
                  value={localSettings.password || ""}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
