"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    const scheduleRegistration = () => {
      const hadController = Boolean(navigator.serviceWorker.controller)
      let reloading = false
      if (hadController) navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return
        reloading = true
        window.location.reload()
      }, { once: true })

      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => registration.update().then(() => navigator.serviceWorker.ready))
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
