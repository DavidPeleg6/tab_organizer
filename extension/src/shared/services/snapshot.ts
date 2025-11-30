import {
  TabSnapshot,
  BrowserWindow,
  TabGroup,
  TabEntry,
  SCHEMA_VERSION,
} from '../schema';

/**
 * Build a TabSnapshot from Chrome API data.
 * Called in the background service worker after querying tabs/windows/groups.
 */
export function buildSnapshot(
  windows: chrome.windows.Window[],
  tabs: chrome.tabs.Tab[],
  groups: chrome.tabGroups.TabGroup[]
): TabSnapshot {
  const capturedAt = new Date().toISOString();

  // Map Chrome windows → BrowserWindow
  const browserWindows: BrowserWindow[] = windows
    .filter((w) => !w.incognito)
    .map((w) => ({
      id: String(w.id),
      focused: w.focused ?? false,
      bounds:
        w.top !== undefined &&
        w.left !== undefined &&
        w.width !== undefined &&
        w.height !== undefined
          ? { top: w.top, left: w.left, width: w.width, height: w.height }
          : null,
      tab_ids: [] as string[], // filled below
    }));

  // Map Chrome tabs → TabEntry
  const tabEntries: TabEntry[] = tabs
    .filter((t) => !t.incognito)
    .map((t) => {
      const entryId = `${t.windowId}-${t.index}`;
      return {
        id: entryId,
        window_id: String(t.windowId),
        group_id: t.groupId !== undefined && t.groupId !== -1 ? String(t.groupId) : null,
        url: t.url ?? '',
        title: t.title ?? '',
        pinned: t.pinned ?? false,
        index: t.index ?? 0,
      };
    });

  // Populate window.tab_ids
  const windowMap = new Map(browserWindows.map((w) => [w.id, w]));
  for (const entry of tabEntries) {
    windowMap.get(entry.window_id)?.tab_ids.push(entry.id);
  }

  // Map Chrome tabGroups → TabGroup
  const tabGroups: TabGroup[] = groups.map((g) => ({
    id: String(g.id),
    title: g.title || null,
    color: g.color || null,
    collapsed: g.collapsed,
    tab_ids: tabEntries.filter((t) => t.group_id === String(g.id)).map((t) => t.id),
  }));

  return {
    version: SCHEMA_VERSION,
    captured_at: capturedAt,
    total_tabs: tabEntries.length,
    total_windows: browserWindows.length,
    total_groups: tabGroups.length,
    windows: browserWindows,
    tab_groups: tabGroups,
    tabs: tabEntries,
  };
}

/**
 * Generate a default filename for the export.
 * Pattern: tabs-export-YYYYMMDD-HHMM.json
 */
export function defaultFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `tabs-export-${date}-${time}.json`;
}

/**
 * Serialize a TabSnapshot to a JSON Blob suitable for download.
 */
export function snapshotToBlob(snapshot: TabSnapshot): Blob {
  const json = JSON.stringify(snapshot, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Serialize a TabSnapshot to a data URL (works in service workers where URL.createObjectURL is unavailable).
 */
export function snapshotToDataUrl(snapshot: TabSnapshot): string {
  const json = JSON.stringify(snapshot, null, 2);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${base64}`;
}

