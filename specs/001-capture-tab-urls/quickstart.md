## Quickstart

### Prerequisites
- Node.js 20+
- npm (or pnpm if installed)
- Chrome 130+ with developer mode enabled

### Install
```bash
cd extension
npm install
```

### Develop
```bash
npm run dev   # Vite watches popup + background TypeScript
```
- Load the unpacked extension from `extension/dist/` in `chrome://extensions` (enable Developer mode).

### Build
```bash
npm run build   # Produces production-ready MV3 bundle into dist/
```

### Test
```bash
npm test   # Runs Vitest unit suite (schema helpers, snapshot logic)
```

### Manual Verification
1. Load the unpacked extension (`extension/dist/`) under `chrome://extensions`.
2. Click the browser action icon → popup opens.
3. Click **Export Tabs** → confirm download prompt → JSON saved.
4. Click **Import Snapshot** → select a saved JSON → windows/tabs recreated.
5. Verify tab groups are restored with correct names and colors.

See `extension/tests/e2e/manual-checklist.md` for a full verification checklist.

### Known Limitations
- Incognito tabs are excluded unless the extension is explicitly allowed in incognito mode.
- Large tab counts (>500) may experience slower import; no progress indicator yet.
- Duplicate filename prevention relies on timestamp; Chrome's save-as dialog allows manual rename.
