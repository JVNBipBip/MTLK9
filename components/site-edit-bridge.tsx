"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { SITE_EDIT_FLAG } from "@/lib/site-editing/protocol"

// Downloaded only when the page is inside the admin's Website editor.
const SiteEditOverlay = dynamic(() => import("@/components/site-edit-overlay"), { ssr: false })

/**
 * Turns on click-to-edit when the site is framed by the admin (frame-ancestors
 * allows nothing else) and was opened with the edit flag. For visitors this
 * renders nothing and loads nothing.
 */
export function SiteEditBridge() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (window.self === window.top) return
    let flagged = new URLSearchParams(window.location.search).has(SITE_EDIT_FLAG)
    try {
      if (flagged) window.sessionStorage.setItem(SITE_EDIT_FLAG, "1")
      else flagged = window.sessionStorage.getItem(SITE_EDIT_FLAG) === "1"
    } catch {
      // Storage blocked: editing still works on the first page via the URL flag.
    }
    if (flagged) setEnabled(true)
  }, [])

  return enabled ? <SiteEditOverlay /> : null
}
