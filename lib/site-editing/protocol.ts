import type { EditDrafts } from "@/lib/site-editing/edit-store"

/**
 * Messages between the site (inside the admin's iframe) and the admin's
 * Website editor. Mirrored in MTLK9-Admin `lib/website/frame-protocol.ts`;
 * keep the two in step.
 */
export const SITE_EDIT_NS = "mtlk9-edit"

/** Query flag on the first iframe URL; remembered for the frame's session. */
export const SITE_EDIT_FLAG = "mtlk9-edit"

export type FieldKind = "text" | "image" | "list"

export type FrameRect = { top: number; left: number; width: number; height: number }

export type SiteToAdmin =
  | { type: "page"; path: string; locale: string; fields: { key: string; kind: FieldKind }[] }
  | { type: "select"; key: string; kind: FieldKind; aspect: string | null; rect: FrameRect }
  | { type: "rect"; key: string; rect: FrameRect | null }
  | { type: "notice"; message: string }

export type AdminToSite =
  | { type: "drafts"; drafts: EditDrafts }
  | { type: "select"; key: string }
  | { type: "deselect" }
  /** He's pointing at this field in the editor's list: outline it (scrolling to it if needed); null clears. */
  | { type: "hover"; key: string | null }
  | { type: "navigate"; path: string }

/** Admin origins allowed to frame and drive the site (from next.config.mjs). */
export function siteEditAdminOrigins(): string[] {
  return (process.env.NEXT_PUBLIC_SITE_EDIT_ADMIN_ORIGINS ?? "").split(",").filter(Boolean)
}
