"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    const scheduleRegistration = () => {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      void navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: `${basePath || ""}/` })
        .then(() => navigator.serviceWorker.ready)
        .then(() => window.dispatchEvent(new Event("runas-pwa-ready")))
        .catch(() => undefined)
    }

    if (document.readyState === "complete") scheduleRegistration()
    else window.addEventListener("load", scheduleRegistration, { once: true })

    return () => {
      window.removeEventListener("load", scheduleRegistration)
    }
  }, [])

  return null
}
