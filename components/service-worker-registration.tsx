"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    void navigator.serviceWorker
      .register(`${basePath}/sw.js`, { scope: `${basePath || ""}/` })
      .catch(() => undefined)
  }, [])

  return null
}
