# Tab Snapshot Logger

A Chrome Manifest V3 extension that captures every open window, tab, and tab group into a portable JSON snapshot, then rebuilds that browsing session on demand. It is built with React + Vite for the popup UI and TypeScript background scripts that talk to the Chrome APIs.

## Features
- Export all non-incognito tabs, their windows, positions, and tab-group metadata into a timestamped JSON file.
- Re-import a saved snapshot to recreate windows, tabs (including pinned order), and tab groups with their titles, colors, and collapsed state.
- Popup UI with filename override, inline success/error toasts, and import validation powered by Zod schemas.
- Background service worker that serializes Chrome state, deduplicates filenames, and streams downloads through `chrome.downloads`.
- Shared schema/tests so popup actions and background logic stay in sync.

## Repository Layout
- `extension/` – MV3 source code bundled by Vite (popup React app, background worker, shared schema/services, tests, build artifacts).
- `specs/` – Product specification set for the "Capture Tab URLs" milestone, including plans, tasks, and manual QA checklists.

## Requirements
- Node.js 20+ and npm (or pnpm if you prefer).
- Google Chrome 130+ with Developer Mode enabled to load unpacked extensions.

## Getting Started
```bash
cd extension
npm install
```

### Develop
```bash
npm run dev      # Builds background + popup code to dist/ and keeps watching
```
1. Run the dev watcher.
2. In Chrome visit `chrome://extensions`, enable **Developer mode**, and use **Load unpacked** → select `extension/dist/`.
3. The watcher keeps the `dist/` output fresh when you edit code.

### Build
```bash
npm run build    # Type-check + production bundle into dist/
```

### Load into Chrome (Unpacked Install)
1. Run `npm run build` (or keep `npm run dev` running) to ensure `extension/dist/` exists.
2. Open Chrome → `chrome://extensions`.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked**, browse to `<repo>/extension/dist/`, and confirm.
5. The Tab Snapshot icon appears in the toolbar; pin it via the Chrome puzzle menu for quick access.

### Package & Share a ZIP
1. From the repo root:  
   ```bash
   cd extension
   npm run build          # refresh the production dist/
   cd dist
   zip -r ../tab-snapshot-logger.zip .
   ```
2. Share the resulting `extension/tab-snapshot-logger.zip` with teammates. They can:
   - Unzip locally, load it as an unpacked extension (steps above), or
   - Keep it zipped and use **Load unpacked** after extracting to any folder.
3. For publishing to the Chrome Web Store, upload the ZIP produced above in the Developer Dashboard; Chrome’s validation requires the MV3 manifest already included here.

### Test
```bash
npm test         # Vitest suite covering schema + snapshot helpers
```
Manual verification steps live in `extension/tests/e2e/manual-checklist.md`.

## Using the Extension
1. Click the Tab Snapshot action icon to open the popup.
2. Optionally edit the suggested filename (defaults to `tabs-export-YYYYMMDD-HHMM.json`).
3. Select **Export Tabs** to trigger the background worker; Chrome prompts for where to save the JSON.
4. To restore, choose **Import Snapshot**, select a previously exported JSON, and the extension recreates the windows, tabs, and tab groups.
5. Status toasts indicate success counts or actionable errors (missing permissions, invalid schema, etc.).

## Documentation
- Functional spec, plan, tasks, and research live under `specs/001-capture-tab-urls/`.
- `extension/public/icons/` contains the branded assets used in the action button.
- For packaging, see the pre-built archive `extension/tab-snapshot-saver.zip`.

## Known Limitations
- Incognito tabs are skipped unless the extension is explicitly allowed in incognito mode.
- Imports that contain hundreds of tabs may take a few seconds; there is no progress indicator yet.
- Filename uniqueness relies on timestamps appended in the background worker, so Chrome’s Save dialog still allows manual overrides.

