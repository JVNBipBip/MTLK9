import { useSyncExternalStore } from "react"
import type { LocalizedString } from "@/lib/site-editing/fields"
import type { ListValue } from "@/lib/site-editing/lists"

/**
 * Unpublished drafts shown while the owner edits.
 *
 * For every visitor this stays `null` and never changes, so editable fields
 * render their published value and nothing re-renders. Only the edit overlay
 * (loaded inside the admin's iframe) calls `setEditDrafts`, which makes the
 * subscribed fields re-render through React with the draft values — no DOM
 * rewriting.
 */
export type EditDrafts = {
  text: Partial<Record<string, Partial<LocalizedString>>>
  images: Partial<Record<string, { src: string; alt?: Partial<LocalizedString> }>>
  lists?: Partial<Record<string, ListValue>>
  /** Price drafts, whole dollars (Prices panel). Pages rebuild their price text from them. */
  prices?: Partial<Record<string, number>>
}

let drafts: EditDrafts | null = null
const listeners = new Set<() => void>()

export function setEditDrafts(next: EditDrafts | null) {
  drafts = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getDrafts = () => drafts
const getServerDrafts = () => null

export function useEditDrafts(): EditDrafts | null {
  return useSyncExternalStore(subscribe, getDrafts, getServerDrafts)
}
