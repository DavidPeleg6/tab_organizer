## Research Findings

### Decision 1: Manifest V3 service worker + TypeScript bundle
- **Decision**: Build the extension with Manifest V3, using a background service worker written in TypeScript and bundled via Vite.
- **Rationale**: MV3 is the long-term supported target and grants access to `chrome.tabs`, `chrome.tabGroups`, and `chrome.downloads`. TypeScript improves reliability when shaping the snapshot schema, while Vite handles fast builds and HMR for the popup UI.
- **Alternatives considered**:
  - **Manifest V2**: deprecated and already blocked for new extensions.
  - **Plain JavaScript without bundler**: faster to start, but no module support or type safety; harder to share schema types between background and UI scripts.

### Decision 2: JSON export schema + download flow
- **Decision**: Assemble snapshot data in the service worker, serialize it with a stable schema (`windows`, `tab_groups`, `tabs`, header metadata), and hand it off to `chrome.downloads.download` using a Blob URL.
- **Rationale**: Keeps all data local, leverages Chrome’s permissioned download path, and doesn’t require packaging files in the extension bundle. The schema lets the import flow validate structure before recreating windows/groups.
- **Alternatives considered**:
  - **`chrome.fileSystem` write**: unavailable to MV3; would require a packaged app.
  - **Saving to synced storage**: storage size limits (5MB) and sync delays make it unreliable for large tab sets.

### Decision 3: Import flow via user-selected JSON file
- **Decision**: Provide a popup page with a `<input type="file">` element; once the user selects a JSON export, the UI reads it via `FileReader`, validates the schema, then sends a `runtime` message to the background worker, which reconstructs windows, tabs, and tab groups using `chrome.windows.create`, `chrome.tabs.create`, and `chrome.tabGroups.update`.
- **Rationale**: Keeps the sensitive file selection in the UI (no extra permissions) and centralizes privileged window creation logic in the service worker. The schema validation step prevents bad data from corrupting the session.
- **Alternatives considered**:
  - **Drag-and-drop import**: nice-to-have but adds accessibility overhead; can be layered later.
  - **Auto-watching the downloads folder**: not possible within extension sandbox without Native Messaging.

