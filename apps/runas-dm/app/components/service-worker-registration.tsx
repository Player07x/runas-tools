"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    const hadController = navigator.serviceWorker.controller !== null
    let refreshing = false
    const handleControllerChange = () => {
      if (!hadController || refreshing) return
      refreshing = true
      window.location.reload()
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          void registration.update().catch(() => undefined)
          return navigator.serviceWorker.ready
        })
        .then(() => window.dispatchEvent(new Event("runas-pwa-ready")))
        .catch(() => undefined)
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
      window.removeEventListener("load", register)
    }
  }, [])

  return null
}
