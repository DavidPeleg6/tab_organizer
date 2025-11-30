import { describe, it, expect } from 'vitest';
import { TabSnapshotSchema, SCHEMA_VERSION } from '@/shared/schema';
import { buildSnapshot, defaultFilename, snapshotToBlob } from '@/shared/services/snapshot';

// ─────────────────────────────────────────────────────────────────────────────
// Stub Chrome types for testing (minimal shapes)
// ─────────────────────────────────────────────────────────────────────────────
const mockWindows: chrome.windows.Window[] = [
  { id: 1, focused: true, incognito: false, top: 0, left: 0, width: 800, height: 600 } as chrome.windows.Window,
  { id: 2, focused: false, incognito: false } as chrome.windows.Window,
];

const mockTabs: chrome.tabs.Tab[] = [
  { id: 10, windowId: 1, index: 0, url: 'https://example.com', title: 'Example', pinned: false, incognito: false, groupId: -1 } as chrome.tabs.Tab,
  { id: 11, windowId: 1, index: 1, url: 'https://test.com', title: 'Test', pinned: true, incognito: false, groupId: 100 } as chrome.tabs.Tab,
  { id: 20, windowId: 2, index: 0, url: 'https://other.com', title: 'Other', pinned: false, incognito: false, groupId: -1 } as chrome.tabs.Tab,
];

const mockGroups: chrome.tabGroups.TabGroup[] = [
  { id: 100, title: 'Research', color: 'blue', collapsed: false, windowId: 1 } as chrome.tabGroups.TabGroup,
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('buildSnapshot', () => {
  it('creates a valid TabSnapshot from Chrome data', () => {
    const snapshot = buildSnapshot(mockWindows, mockTabs, mockGroups);

    // Basic structure checks
    expect(snapshot.version).toBe(SCHEMA_VERSION);
    expect(snapshot.total_windows).toBe(2);
    expect(snapshot.total_tabs).toBe(3);
    expect(snapshot.total_groups).toBe(1);

    // Validate against Zod schema
    const result = TabSnapshotSchema.safeParse(snapshot);
    expect(result.success).toBe(true);
  });

  it('links tabs to their groups correctly', () => {
    const snapshot = buildSnapshot(mockWindows, mockTabs, mockGroups);
    const group = snapshot.tab_groups.find((g) => g.id === '100');
    expect(group).toBeDefined();
    expect(group!.tab_ids).toContain('1-1'); // windowId-index for pinned tab
  });

  it('populates window.tab_ids', () => {
    const snapshot = buildSnapshot(mockWindows, mockTabs, mockGroups);
    const win1 = snapshot.windows.find((w) => w.id === '1');
    expect(win1?.tab_ids).toHaveLength(2);
  });
});

describe('defaultFilename', () => {
  it('returns a filename matching expected pattern', () => {
    const filename = defaultFilename();
    expect(filename).toMatch(/^tabs-export-\d{8}-\d{4}\.json$/);
  });
});

describe('snapshotToBlob', () => {
  it('returns a JSON blob', () => {
    const snapshot = buildSnapshot(mockWindows, mockTabs, mockGroups);
    const blob = snapshotToBlob(snapshot);
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
  });
});

