"use client"

import { useEffect, useId, useState } from "react"
import CharacterCount from "@tiptap/extension-character-count"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Eraser, Italic, List, ListOrdered, Underline } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  className?: string
}

export function RichTextEditor({ label, value, onChange, maxLength = 1000, className }: RichTextEditorProps) {
  const id = useId()
  const [length, setLength] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-labelledby": `${id}-label`,
        class:
          "min-h-52 px-4 py-3 text-sm leading-relaxed text-foreground outline-none [&_p]:my-1.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      setLength(currentEditor.storage.characterCount.characters())
    },
    onUpdate: ({ editor: currentEditor }) => {
      setLength(currentEditor.storage.characterCount.characters())
      onChange(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return
    editor.commands.setContent(value, { emitUpdate: false })
    setLength(editor.storage.characterCount.characters())
  }, [editor, value])

  const tools = [
    {
      label: "Negrito",
      icon: Bold,
      active: editor?.isActive("bold") ?? false,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Itálico",
      icon: Italic,
      active: editor?.isActive("italic") ?? false,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Sublinhado",
      icon: Underline,
      active: editor?.isActive("underline") ?? false,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Lista",
      icon: List,
      active: editor?.isActive("bulletList") ?? false,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Lista numerada",
      icon: ListOrdered,
      active: editor?.isActive("orderedList") ?? false,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Limpar formatação",
      icon: Eraser,
      active: false,
      run: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ]

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3 px-2">
        <label id={`${id}-label`} className="text-sm font-medium text-muted-foreground">{label}</label>
        <span className="text-[0.68rem] tabular-nums text-muted-foreground">{length}/{maxLength}</span>
      </div>
      <div className="overflow-hidden rounded-[18px] border border-input bg-background/65 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
        <div className="flex flex-wrap gap-1 border-b border-border/70 bg-muted/55 p-1.5">
          {tools.map(({ label: toolLabel, icon: Icon, active, run }) => (
            <button
              key={toolLabel}
              type="button"
              title={toolLabel}
              aria-label={toolLabel}
              aria-pressed={active}
              disabled={!editor}
              onClick={run}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-40",
                active && "bg-card text-foreground shadow-sm",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
