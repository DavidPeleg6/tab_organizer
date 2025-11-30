# Implementation Plan: Chrome Tab Snapshot Logger

**Branch**: `001-capture-tab-urls` | **Date**: Nov 30, 2025 | **Spec**: `/specs/001-capture-tab-urls/spec.md`
**Input**: Feature specification from `/specs/001-capture-tab-urls/spec.md`

## Summary

Build a Manifest V3 Chrome extension that snapshots every non-incognito tab into a structured JSON file (including window + tab-group metadata) and can later reload that JSON to recreate the exact browsing layout. The background service worker handles tab enumeration, schema assembly, and download delivery, while the popup UI lets users trigger exports, rename files, and import a saved snapshot via file selection. TypeScript + Vite provide a single codebase for background, popup, and shared schema logic.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (Node 20 toolchain)  
**Primary Dependencies**: Chrome Extensions MV3 APIs (`chrome.tabs`, `chrome.tabGroups`, `chrome.downloads`), Vite 5 build pipeline, React or lightweight view layer for popup, Zod for schema validation  
**Storage**: Local JSON files via Chrome downloads (export) + in-memory snapshot payload passed from popup to service worker (import)  
**Testing**: Vitest for schema/helpers, manual Chrome verification scripts (future Playwright-based automation optional)  
**Target Platform**: Desktop Chrome 130+ (Manifest V3, service-worker background)  
**Project Type**: Single browser-extension project (background + popup + shared libs)  
**Performance Goals**: No strict targets; must comfortably handle ~500 tabs with best-effort progress messaging  
**Constraints**: Data must stay local (no remote sync), operate offline, respect MV3 service-worker lifetime and permission prompts  
**Scale/Scope**: Single-user workflow with up to a few hundred tabs per snapshot; no multi-profile sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file currently contains only placeholders, so there are no enforced principles or gates. Proceeding under the assumption that no additional guardrails apply. If a ratified constitution appears later, this plan must be re-validated.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
extension/
├── manifest.json
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── popup/
│   │   ├── App.tsx
│   │   └── components/
│   ├── options/
│   │   └── index.tsx
│   └── shared/
│       ├── schema.ts
│       └── services/
│           └── snapshot.ts
├── public/
│   └── icons/
└── tests/
    ├── unit/
    │   └── snapshot.spec.ts
    └── e2e/
        └── manual-checklist.md
```

**Structure Decision**: Single browser-extension workspace rooted at `extension/` keeps popup, options page, background worker, and shared schema in one TypeScript project. Tests live beside source to keep Vitest configs simple; manual e2e checklist documents Chrome steps until full automation exists.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
