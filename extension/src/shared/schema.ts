import { z } from 'zod';

/**
 * Zod schemas + TypeScript types for Tab Snapshot data model.
 * These are shared between popup, background, and tests.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Window Bounds (optional geometry)
// ─────────────────────────────────────────────────────────────────────────────
export const BoundsSchema = z.object({
  top: z.number(),
  left: z.number(),
  width: z.number(),
  height: z.number(),
});
export type Bounds = z.infer<typeof BoundsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// BrowserWindow
// ─────────────────────────────────────────────────────────────────────────────
export const BrowserWindowSchema = z.object({
  id: z.string(),
  focused: z.boolean(),
  bounds: BoundsSchema.nullable(),
  tab_ids: z.array(z.string()),
});
export type BrowserWindow = z.infer<typeof BrowserWindowSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TabGroup
// ─────────────────────────────────────────────────────────────────────────────
export const TabGroupSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  color: z.string().nullable(),
  collapsed: z.boolean(),
  tab_ids: z.array(z.string()),
});
export type TabGroup = z.infer<typeof TabGroupSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TabEntry
// ─────────────────────────────────────────────────────────────────────────────
export const TabEntrySchema = z.object({
  id: z.string(),
  window_id: z.string(),
  group_id: z.string().nullable(),
  url: z.string(),
  title: z.string(),
  pinned: z.boolean(),
  index: z.number(),
});
export type TabEntry = z.infer<typeof TabEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TabSnapshot (root export document)
// ─────────────────────────────────────────────────────────────────────────────
export const SCHEMA_VERSION = '1.0.0';

export const TabSnapshotSchema = z.object({
  version: z.string(),
  captured_at: z.string(), // ISO 8601
  total_tabs: z.number(),
  total_windows: z.number(),
  total_groups: z.number(),
  windows: z.array(BrowserWindowSchema),
  tab_groups: z.array(TabGroupSchema),
  tabs: z.array(TabEntrySchema),
});
export type TabSnapshot = z.infer<typeof TabSnapshotSchema>;

