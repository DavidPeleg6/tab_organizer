## Data Model

### TabSnapshot
- **Fields**
  - `version` (string, semver) – allows schema evolution. Required.
  - `captured_at` (ISO 8601 string) – timestamp of export.
  - `total_tabs` (number) – derived count; must match length of `tabs`.
  - `total_windows` (number) – derived count; must match length of `windows`.
  - `total_groups` (number) – derived count; must match length of `tab_groups`.
  - `windows` (BrowserWindow[]) – ordered snapshot of each window.
  - `tab_groups` (TabGroup[]) – tab group definitions; may be empty.
  - `tabs` (TabEntry[]) – flattened tab list with references to windows & groups.
- **Rules**
  - `total_*` values must stay in sync with array lengths during export.
  - Import flow validates window and group references before attempting recreation.

### BrowserWindow
- **Fields**
  - `id` (string) – exported ID; use Chrome window id as string.
  - `focused` (boolean)
  - `bounds` (object | null) – `{ top, left, width, height }` if available.
  - `tab_ids` (string[]) – ordered list of TabEntry IDs belonging to this window.
- **Rules**
  - `tab_ids` order reflects Chrome’s tab index order.
  - When importing, new window IDs differ; mapping remains internal.

### TabGroup
- **Fields**
  - `id` (string)
  - `title` (string | null)
  - `color` (string | null) – Chrome-supported color keyword.
  - `collapsed` (boolean)
  - `tab_ids` (string[]) – tabs assigned to this group.
- **Rules**
  - Ungrouped tabs omit group reference (null).
  - Import must create the group before assigning tabs.

### TabEntry
- **Fields**
  - `id` (string) – exported identifier (windowId-tabIndex).
  - `window_id` (string) – references BrowserWindow.id.
  - `group_id` (string | null) – references TabGroup.id; null when ungrouped.
  - `url` (string)
  - `title` (string)
  - `pinned` (boolean)
  - `index` (number) – zero-based order within its window.
- **Rules**
  - URLs captured verbatim; no normalization.
  - Import flow recreates pinned tabs first before non-pinned to maintain order.

