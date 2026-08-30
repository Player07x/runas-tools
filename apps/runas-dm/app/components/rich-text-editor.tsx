"use client"

import { useEffect, useId, useRef } from "react"
import { Bold, Eraser, Italic, List, ListOrdered, Underline } from "lucide-react"

const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI"])

export function sanitizeRichText(value: string): string {
  if (typeof DOMParser === "undefined") return value
  const documentValue = new DOMParser().parseFromString(value, "text/html")
  for (const element of [...documentValue.body.querySelectorAll("*")]) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      continue
    }
    for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name)
  }
  return documentValue.body.innerHTML
}

export function RichTextEditor({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  const id = useId()
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const safe = sanitizeRichText(value)
    if (editor.innerHTML !== safe) editor.innerHTML = safe
  }, [value])

  function command(name: string, argument?: string) {
    editorRef.current?.focus()
    document.execCommand(name, false, argument)
    const editor = editorRef.current
    if (editor) onChange(sanitizeRichText(editor.innerHTML))
  }

  const tools = [
    { label: "Negrito", icon: Bold, command: "bold" },
    { label: "Itálico", icon: Italic, command: "italic" },
    { label: "Sublinhado", icon: Underline, command: "underline" },
    { label: "Lista", icon: List, command: "insertUnorderedList" },
    { label: "Lista numerada", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Limpar formatação", icon: Eraser, command: "removeFormat" },
  ]

  return <label className={`rich-text-field ${className}`}><span id={`${id}-label`}>{label}</span><div className="rich-text-shell"><div className="rich-text-toolbar">{tools.map(({ label: toolLabel, icon: Icon, command: toolCommand }) => <button key={toolLabel} type="button" title={toolLabel} aria-label={toolLabel} onMouseDown={(event) => event.preventDefault()} onClick={() => command(toolCommand)}><Icon size={15} /></button>)}</div><div ref={editorRef} className="rich-text-content" contentEditable role="textbox" aria-multiline="true" aria-labelledby={`${id}-label`} suppressContentEditableWarning onInput={(event) => onChange(sanitizeRichText(event.currentTarget.innerHTML))} /></div></label>
}
