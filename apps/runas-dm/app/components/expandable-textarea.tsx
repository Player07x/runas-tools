"use client"

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react"

type ExpandableTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  resizeKey?: string
}

export function ExpandableTextarea({ resizeKey, style, ...props }: ExpandableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const minimumHeight = Number.parseFloat(window.getComputedStyle(textarea).minHeight) || 0
    const contentHeight = Math.max(minimumHeight, textarea.scrollHeight + 2)
    textarea.style.height = `${contentHeight}px`
    textarea.style.maxHeight = `${contentHeight * 2}px`
  }, [resizeKey])

  return <textarea ref={textareaRef} style={style} {...props} />
}
