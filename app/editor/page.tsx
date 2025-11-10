import { DocWaveEditor } from "@/components/docwave-editor"

export const metadata = {
  title: "Editor - DocWave",
  description: "Create and edit documents with real-time collaboration",
}

type EditorPageProps = {
  searchParams?: {
    id?: string
  }
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  const docId = typeof searchParams?.id === "string" ? searchParams.id : undefined
  return <DocWaveEditor docId={docId} />
}
