# Feature Specification: Chrome Tab Snapshot Logger

**Feature Branch**: `001-capture-tab-urls`  
**Created**: Nov 30, 2025  
**Status**: Draft  
**Input**: User description: "id like to create a google chrome extension, that captures the urls of all the currently open tabs, and logs them into a json file. it should also be able to capture grouped tabs"

## Clarifications

### Session 2025-11-30

- Q: When loading a saved tab JSON, should the extension auto-recreate everything or offer manual selection? → A: Auto-recreate windows, tabs, and groups exactly as saved.
- Q: Should the success criteria stay as quantitative metrics or become qualitative checks since this is a private project? → A: Replace with qualitative completion checklist only.
- Q: Are privacy-only requirements (metadata only, no local copy beyond JSON) necessary for this solo project? → A: No; remove those requirements from scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export every open tab on demand (Priority: P1)

As a tab-heavy Chrome user, I can click an extension action to capture every currently open tab across my browser windows so that I have a timestamped JSON snapshot I can revisit later.

**Why this priority**: This is the core promise of the extension and the primary reason users install it.

**Independent Test**: Trigger an export with 1+ windows and confirm a JSON file downloads that lists each tab with URL, title, window reference, and timestamp.

**Acceptance Scenarios**:

1. **Given** at least one browser window is open, **When** I trigger "Export tabs", **Then** a JSON file downloads containing each tab URL, title, and reference metadata.  
2. **Given** an export completes, **When** I review the JSON file, **Then** it shows the time of capture and the count of tabs captured so I can verify completeness.

---

### User Story 2 - Preserve tab group organization (Priority: P2)

As a user organizing research into Chrome tab groups, I want the export to include each group's name, color, and member tabs so I can reconstruct the structure later.

**Why this priority**: Users investing effort in tab groups expect organizational metadata to be saved along with URLs.

**Independent Test**: Create multiple tab groups with distinct colors, export, and verify the JSON shows groups with their tabs attached even if some groups are collapsed.

**Acceptance Scenarios**:

1. **Given** I have tabs assigned to named groups, **When** I export, **Then** the JSON includes a `tab_groups` collection with name, color, and tab references.  
2. **Given** a tab group is empty or unnamed, **When** I export, **Then** the JSON still records the group and flags it appropriately so nothing silently disappears.
3. **Given** I load a previously exported JSON, **When** the extension processes it, **Then** it restores windows, tabs, and tab groups exactly as described so the saved organization reappears.

---

### User Story 3 - Manage exports for repeat use (Priority: P3)

As someone who snapshots tabs frequently, I can set a meaningful filename (or accept a timestamp default) and see a success toast so I know where to find the JSON and whether the export succeeded.

**Why this priority**: Repeat users need light controls to avoid overwriting files and to trust that the action worked.

**Independent Test**: Trigger exports twice in a row, confirm filenames are unique, and verify the UI gives success/failure messaging without requiring dev tools.

**Acceptance Scenarios**:

1. **Given** I accept the default filename pattern, **When** multiple exports happen in the same day, **Then** each JSON name remains unique so no data is lost.  
2. **Given** a failure occurs (permissions, download blocked), **When** the export fails, **Then** the extension shows an actionable error message describing how to fix it.

---

### Edge Cases

- User triggers export with zero normal windows (e.g., only incognito) and the extension lacks incognito permission.  
- Browser has >500 tabs resulting in large payloads or Chrome-imposed execution limits (explicitly out of scope; best-effort only).  
- Tab groups exist without names or colors, or groups referenced tabs that have just closed.  
- Download permissions denied by Chrome policy or enterprise restrictions.  
- User is offline or Chrome forbids file creation in the chosen directory.  
- Pinned tabs, apps, or Chrome Web Store tabs that may require special handling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide a clear user control (browser action icon or popup CTA) that initiates the tab export workflow.  
- **FR-002**: When triggered, collect every non-incognito tab's URL, title, pinned state, window identifier, and position at the moment of export.  
- **FR-003**: Capture tab group metadata (name, color, collapsed state, member tab IDs) and attach each tab to the correct group entry; ungrouped tabs must still be listed.  
- **FR-004**: Generate a JSON document that includes export timestamp, total counts (windows, groups, tabs), and structured arrays for windows, groups, and tabs.  
- **FR-005**: Prompt the user to confirm or edit the suggested filename (default: `tabs-export-YYYYMMDD-HHMM.json`) before download and ensure filenames are unique per export.  
- **FR-006**: Deliver the JSON file via the browser’s standard download flow and surface success/failure messaging within the extension UI.  
- **FR-007**: Handle permission or data-collection failures gracefully by notifying the user which capability is missing (e.g., tab access, download access) and how to resolve it.  
- **FR-009**: Provide a load flow that accepts a previously exported JSON and automatically recreates all saved windows, tabs, and tab groups in Chrome, matching their saved order and grouping.

### Key Entities *(include if feature involves data)*

- **Tab Snapshot**: Represents one export event; attributes include timestamp, export id/filename, total tab count, and window summaries.  
- **Browser Window**: Captures window id, focus state, and ordered tab references belonging to that window at export time.  
- **Tab Group**: Contains group id, name, color, collapsed state, and a list of associated tab ids.  
- **Tab Entry**: Stores tab id, window id, group id (if any), URL, title, pinned flag, and positional index.

## Assumptions

- Users initiate exports manually from the extension icon; no automatic or scheduled exports are required.  
- JSON files are downloaded to the user’s default download directory, and users can rename files during the download prompt.  
- Incognito windows are excluded unless the user explicitly grants Chrome’s “Allow in incognito” permission outside this feature.  
- Users primarily care about URLs and organization metadata; no page content or browsing history beyond current tabs is needed.  
- The feature depends on Chrome granting access to tab metadata, tab-group details, and file downloads; the extension must request those permissions if they are not already approved.

## Success Criteria *(mandatory)*

### Completion Checklist

- **SC-Load**: Loading an exported JSON recreates the same windows, tabs, and tab groups with matching organization.  
- **SC-Export**: Export flow always writes a JSON file locally without requiring manual file management.  
- **SC-Message**: The extension surfaces a visible toast or popup indicating success or describing any failure cause.  
