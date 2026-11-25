"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { setEditDrafts } from "@/lib/site-editing/edit-store"
import {
  SITE_EDIT_NS,
  siteEditAdminOrigins,
  type AdminToSite,
  type FieldKind,
  type FrameRect,
  type SiteToAdmin,
} from "@/lib/site-editing/protocol"

/**
 * Click-to-edit inside the admin's Website editor.
 *
 * It only highlights and reports: hovering outlines owner-editable fields
 * (`[data-edit-key]`, rendered by EditableText/EditableImage), clicking one
 * tells the admin which field was picked, and drafts the admin sends back are
 * shown through the edit store (React re-renders; nothing rewrites the DOM).
 * It never saves anything — all saving happens in the admin, behind its login.
 *
 * While editing, links off the site and form submissions are blocked so the
 * owner can't accidentally book, pay or send something.
 */

const ADMIN_ORIGINS = siteEditAdminOrigins()

function send(message: SiteToAdmin) {
  for (const origin of ADMIN_ORIGINS) window.parent.postMessage({ ns: SITE_EDIT_NS, ...message }, origin)
}

function rectOf(element: Element): FrameRect {
  const rect = element.getBoundingClientRect()
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}

/** The editable field under the pointer. Link labels marked list-only are skipped, so links still work. */
function editableFrom(target: EventTarget | null): HTMLElement | null {
  const element = target instanceof Element ? target.closest<HTMLElement>("[data-edit-key]") : null
  return element && element.dataset.editListOnly !== "true" ? element : null
}

function kindOf(element: HTMLElement): FieldKind {
  const type = element.dataset.editType
  return type === "image" || type === "list" ? type : "text"
}

function findField(key: string) {
  const all = document.querySelectorAll<HTMLElement>(`[data-edit-key="${CSS.escape(key)}"]`)
  // Prefer a copy that's actually shown (some sections render a mobile and a desktop version).
  for (const element of all) {
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return element
  }
  return all[0] ?? null
}

/** Whether most of the element is already on screen. */
function inView(element: Element) {
  const rect = element.getBoundingClientRect()
  const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
  return visibleHeight >= Math.min(rect.height, window.innerHeight) * 0.6
}

function fieldsOnPage() {
  const seen = new Map<string, FieldKind>()
  document.querySelectorAll<HTMLElement>("[data-edit-key]").forEach((element) => {
    const key = element.dataset.editKey
    if (key && !seen.has(key)) seen.set(key, kindOf(element))
  })
  return [...seen].map(([key, kind]) => ({ key, kind }))
}

type Highlight = { key: string; kind: FieldKind; rect: FrameRect }

export default function SiteEditOverlay() {
  const pathname = usePathname()
  const [hover, setHover] = useState<Highlight | null>(null)
  const [active, setActive] = useState<Highlight | null>(null)
  const hoverEl = useRef<HTMLElement | null>(null)
  const activeEl = useRef<HTMLElement | null>(null)

  const select = useCallback((element: HTMLElement, scroll: boolean) => {
    const key = element.dataset.editKey!
    const kind: FieldKind = kindOf(element)
    activeEl.current = element
    if (scroll) element.scrollIntoView({ block: "center", behavior: "smooth" })
    const rect = rectOf(element)
    setActive({ key, kind, rect })
    send({ type: "select", key, kind, aspect: element.dataset.editAspect ?? null, rect })
  }, [])

  // Tell the admin which page this is and what can be edited on it.
  useEffect(() => {
    activeEl.current = null
    setActive(null)
    const timer = window.setTimeout(() => {
      const locale = window.location.pathname.split("/")[1] === "fr" ? "fr" : "en"
      send({ type: "page", path: window.location.pathname, locale, fields: fieldsOnPage() })
    }, 60)
    return () => window.clearTimeout(timer)
  }, [pathname])

  // Messages from the admin.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!ADMIN_ORIGINS.includes(event.origin) || event.source !== window.parent) return
      const data = event.data as (AdminToSite & { ns?: string }) | null
      if (!data || data.ns !== SITE_EDIT_NS) return
      switch (data.type) {
        case "drafts":
          setEditDrafts(data.drafts)
          break
        case "select": {
          const element = findField(data.key)
          if (element) select(element, true)
          break
        }
        case "deselect":
          activeEl.current = null
          setActive(null)
          break
        case "hover": {
          const element = typeof data.key === "string" ? findField(data.key) : null
          if (!element) {
            hoverEl.current = null
            setHover(null)
            break
          }
          if (!inView(element)) element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" })
          hoverEl.current = element
          setHover({ key: element.dataset.editKey!, kind: kindOf(element), rect: rectOf(element) })
          break
        }
        case "navigate":
          // A full load, not router.push: the locale lives in the root layout, which
          // a client-side navigation from /en/… to /fr/… would not re-render.
          // Only pages on this site: never another address or a javascript: link.
          if (typeof data.path === "string" && /^\/(?![/\\])/.test(data.path)) {
            const target = new URL(data.path, window.location.origin)
            if (target.origin === window.location.origin) window.location.assign(target.pathname + target.search + target.hash)
          }
          break
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [select])

  // Hover, click and the safety blocks.
  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const element = editableFrom(event.target)
      hoverEl.current = element
      setHover(
        element
          ? { key: element.dataset.editKey!, kind: kindOf(element), rect: rectOf(element) }
          : null,
      )
    }
    const onLeave = () => {
      hoverEl.current = null
      setHover(null)
    }
    const onClick = (event: MouseEvent) => {
      const element = editableFrom(event.target)
      if (element) {
        event.preventDefault()
        event.stopPropagation()
        select(element, false)
        return
      }
      const link = event.target instanceof Element ? event.target.closest("a") : null
      if (!link) return
      const href = link.getAttribute("href") ?? ""
      const offSite = /^(tel|mailto|sms):/i.test(href) || link.target === "_blank" || new URL(link.href, window.location.href).origin !== window.location.origin
      if (offSite) {
        event.preventDefault()
        event.stopPropagation()
        send({ type: "notice", message: "Links to other websites, phone numbers and emails are turned off while editing." })
      }
    }
    const onSubmit = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      send({ type: "notice", message: "Forms are turned off while editing, so nothing gets booked or sent." })
    }

    document.addEventListener("mousemove", onMove, true)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("click", onClick, true)
    document.addEventListener("submit", onSubmit, true)
    return () => {
      document.removeEventListener("mousemove", onMove, true)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("submit", onSubmit, true)
    }
  }, [select])

  // Keep the outlines (and the admin's edit box) on their element while scrolling,
  // resizing, or when the text changes length as he types.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (hoverEl.current) {
        const element = hoverEl.current
        setHover((current) => (current ? { ...current, rect: rectOf(element) } : current))
      }
      if (activeEl.current) {
        const element = activeEl.current.isConnected ? activeEl.current : findField(activeEl.current.dataset.editKey!)
        activeEl.current = element
        const rect = element ? rectOf(element) : null
        setActive((current) => (current && rect ? { ...current, rect } : current))
        if (element) send({ type: "rect", key: element.dataset.editKey!, rect })
      }
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => {
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <style>{`[data-edit-key]{cursor:pointer}`}</style>
      {hover && hover.key !== active?.key && <Outline rect={hover.rect} label={hover.kind === "image" ? "Replace photo" : hover.kind === "list" ? "Edit questions" : "Edit text"} dashed />}
      {active && <Outline rect={active.rect} />}
    </>
  )
}

function Outline({ rect, label, dashed }: { rect: FrameRect; label?: string; dashed?: boolean }) {
  const pad = 4
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        border: `2px ${dashed ? "dashed" : "solid"} #059669`,
        borderRadius: 6,
        background: dashed ? "rgba(5,150,105,0.06)" : "rgba(5,150,105,0.10)",
        pointerEvents: "none",
        zIndex: 2147483646,
      }}
    >
      {label && (
        <span
          style={{
            position: "absolute",
            top: -24,
            left: -2,
            padding: "2px 8px",
            borderRadius: 4,
            background: "#059669",
            color: "white",
            font: "600 12px/18px system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
