import { buildSnapshot, snapshotToDataUrl, defaultFilename } from '@/shared/services/snapshot';

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Snapshot Logger installed');
});

// ─────────────────────────────────────────────────────────────────────────────
// Message Router
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXPORT_SNAPSHOT') {
    handleExport(message.filename)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err) }));
    return true; // keep channel open for async
  }

  if (message.type === 'IMPORT_SNAPSHOT') {
    handleImport(message.snapshot)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  // Ping for health check
  if (message.type === 'PING') {
    sendResponse({ ok: true });
  }

  return false;
});

// ─────────────────────────────────────────────────────────────────────────────
// Export Handler
// ─────────────────────────────────────────────────────────────────────────────
async function handleExport(filenameOverride?: string) {
  // Gather Chrome data
  const [windows, tabs, groups] = await Promise.all([
    chrome.windows.getAll({ populate: false }),
    chrome.tabs.query({}),
    chrome.tabGroups.query({}),
  ]);

  const snapshot = buildSnapshot(windows, tabs, groups);
  const dataUrl = snapshotToDataUrl(snapshot);

  const filename = sanitizeFilename(filenameOverride) || defaultFilename();

  const downloadId = await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true,
  });

  return {
    downloadId,
    filename,
    totalTabs: snapshot.total_tabs,
    totalWindows: snapshot.total_windows,
    totalGroups: snapshot.total_groups,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Import Handler – recreate windows, tabs, and groups from a snapshot
// ─────────────────────────────────────────────────────────────────────────────
import { TabSnapshot, TabSnapshotSchema } from '@/shared/schema';

async function handleImport(snapshotRaw: unknown) {
  // Validate incoming payload
  const parsed = TabSnapshotSchema.safeParse(snapshotRaw);
  if (!parsed.success) {
    throw new Error('Invalid snapshot schema');
  }
  const snapshot: TabSnapshot = parsed.data;

  // If there's only one window in the snapshot, restore all tabs into a single new window
  // This is the common case and avoids splitting tabs across windows unexpectedly
  const singleWindowMode = snapshot.windows.length === 1;

  // Maps old IDs → new Chrome IDs
  const windowIdMap = new Map<string, number>();
  const tabsToRemove: number[] = []; // default blank tabs to clean up later

  let restoredTabs = 0;

  // 1. Create windows
  if (singleWindowMode) {
    // Create just one window for all tabs
    const win = snapshot.windows[0];
    const createData: chrome.windows.CreateData = {
      focused: true,
      url: 'about:blank',
      ...(win.bounds && {
        top: win.bounds.top,
        left: win.bounds.left,
        width: win.bounds.width,
        height: win.bounds.height,
      }),
    };
    const newWin = await chrome.windows.create(createData);
    if (newWin?.id) {
      // Map ALL old window IDs to this single new window
      for (const w of snapshot.windows) {
        windowIdMap.set(w.id, newWin.id);
      }
      if (newWin.tabs && newWin.tabs.length > 0 && newWin.tabs[0].id) {
        tabsToRemove.push(newWin.tabs[0].id);
      }
    }
  } else {
    // Multi-window mode: create separate windows
    for (const win of snapshot.windows) {
      const createData: chrome.windows.CreateData = {
        focused: win.focused,
        url: 'about:blank',
        ...(win.bounds && {
          top: win.bounds.top,
          left: win.bounds.left,
          width: win.bounds.width,
          height: win.bounds.height,
        }),
      };
      const newWin = await chrome.windows.create(createData);
      if (newWin?.id) {
        windowIdMap.set(win.id, newWin.id);
        if (newWin.tabs && newWin.tabs.length > 0 && newWin.tabs[0].id) {
          tabsToRemove.push(newWin.tabs[0].id);
        }
      }
    }
  }

  // 2. Create tabs (pinned first to preserve order)
  const sortedTabs = [...snapshot.tabs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.index - b.index;
  });

  const tabIdMap = new Map<string, number>(); // old id → new Chrome tab id

  for (const entry of sortedTabs) {
    const windowId = windowIdMap.get(entry.window_id);
    if (!windowId) continue;

    try {
      const newTab = await chrome.tabs.create({
        windowId,
        url: entry.url,
        pinned: entry.pinned,
        active: false,
      });

      if (newTab.id) {
        tabIdMap.set(entry.id, newTab.id);
        restoredTabs++;
      }
    } catch (err) {
      console.warn(`Failed to create tab for ${entry.url}:`, err);
    }
  }

  // 3. Remove the placeholder blank tabs now that real tabs exist
  for (const tabId of tabsToRemove) {
    try {
      await chrome.tabs.remove(tabId);
    } catch {
      // Tab may already be gone, ignore
    }
  }

  // 4. Create tab groups and assign tabs
  for (const group of snapshot.tab_groups) {
    const tabIds = group.tab_ids
      .map((oldId) => tabIdMap.get(oldId))
      .filter((id): id is number => id !== undefined);

    if (tabIds.length === 0) continue;

    try {
      const newGroupId = await chrome.tabs.group({ tabIds });

      // Update group properties
      await chrome.tabGroups.update(newGroupId, {
        title: group.title ?? undefined,
        color: (group.color as chrome.tabGroups.ColorEnum) ?? undefined,
        collapsed: group.collapsed,
      });
    } catch (err) {
      console.warn(`Failed to create group ${group.title}:`, err);
    }
  }

  return { restoredWindows: windowIdMap.size, restoredTabs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeFilename(name?: string): string {
  if (!name) return '';
  // Remove or replace dangerous characters
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
}

/**
 * Make filename unique by appending a timestamp suffix if it already exists.
 * Since we can't reliably query the filesystem from the extension, we append
 * the current time in milliseconds to guarantee uniqueness.
 */
function ensureUniqueFilename(name: string): string {
  const ext = name.endsWith('.json') ? '' : '.json';
  const base = name.replace(/\.json$/i, '');
  const ts = Date.now();
  return `${base}-${ts}${ext}`;
}
