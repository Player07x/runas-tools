"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => window.dispatchEvent(new Event("runas-pwa-ready")))
        .catch(() => undefined)
    }

    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
