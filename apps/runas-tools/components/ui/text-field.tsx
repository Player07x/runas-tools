"use client"

import type React from "react"
import { useId } from "react"
import { cn } from "@/lib/utils"

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "textarea"
  className?: string
}

const inputClasses =
  "h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25"

export function TextField({ label, value, onChange, placeholder, type = "text", className }: TextFieldProps) {
  const id = useId()
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={cn(inputClasses, "h-auto min-h-20 resize-y py-3 leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
        />
      )}
    </div>
  )
}
