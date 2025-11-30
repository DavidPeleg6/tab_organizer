```text
Feature: Chrome Tab Snapshot Logger
Branch: 001-capture-tab-urls
Spec: /specs/001-capture-tab-urls/spec.md
Plan: /specs/001-capture-tab-urls/plan.md
```

## Phase 1 – Setup
- [x] T001 Initialize extension workspace structure under `extension/` with manifest stub, src folders, tests, and Vite config.
- [x] T002 Install toolchain dependencies (pnpm, Vite, TypeScript, React, Zod, Vitest) and record commands in `package.json`.
- [x] T003 Configure `extension/manifest.json` for MV3 with permissions (`tabs`, `tabGroups`, `downloads`), background service worker, and action popup entries.

## Phase 2 – Foundational Infrastructure
- [x] T004 Create shared schema + types in `extension/src/shared/schema.ts` reflecting `TabSnapshot`, `BrowserWindow`, `TabGroup`, and `TabEntry`.
- [x] T005 Implement snapshot serialization helpers in `extension/src/shared/services/snapshot.ts` to map Chrome tab APIs into schema objects.
- [x] T006 Add Vitest setup (`extension/vitest.config.ts`) and initial schema tests in `extension/tests/unit/snapshot.spec.ts`.

## Phase 3 – User Story 1 (P1): Export every open tab on demand
**Goal**: Button-triggered export saves all non-incognito tabs/windows to JSON with timestamp metadata.  
**Independent Test**: Trigger export with multiple windows; confirm downloaded JSON lists every tab with URL, title, window reference, timestamp.

- [x] T007 [US1] Build popup UI control in `extension/src/popup/App.tsx` with primary "Export tabs" CTA triggering background message.
- [x] T008 [US1] Implement background handler in `extension/src/background/index.ts` that collects all non-incognito tabs, windows, and metadata via Chrome APIs.
- [x] T009 [US1] Integrate filename suggestion + confirmation (default `tabs-export-YYYYMMDD-HHMM.json`) in popup and pass override to background via message payload.
- [x] T010 [US1] Wire snapshot serialization to `chrome.downloads.download`, ensuring blobs are generated and cleaned up after download.
- [x] T011 [US1] Surface success/error toast in popup (e.g., lightweight state hook) and log failures with actionable guidance.

## Phase 4 – User Story 2 (P2): Preserve tab group organization & load snapshots
**Goal**: Export includes tab group metadata and load recreates saved windows/groups exactly.  
**Independent Test**: Create colored tab groups, export, then import JSON; verify names, colors, collapsed state, and members are restored.

- [x] T012 [US2] Extend background export logic to capture `chrome.tabGroups` data, map to schema, and link tabs → groups in `snapshot.ts`.
- [x] T013 [US2] Add tab group + window counts to JSON header and ensure totals stay in sync with arrays.
- [x] T014 [US2] Implement popup import UI (file input + validation) in `extension/src/popup/components/ImportControl.tsx`.
- [x] T015 [US2] Validate selected JSON using Zod schema; show inline errors for invalid structure before sending to background.
- [x] T016 [US2] Implement background import handler that re-creates windows via `chrome.windows.create`, then tabs and tab groups, respecting original order/pinned states.
- [x] T017 [US2] Handle edge cases (missing permissions, >500 tabs, unnamed groups) by displaying user-facing errors and safe fallbacks.

## Phase 5 – User Story 3 (P3): Manage exports for repeat use
**Goal**: Users can set filenames (or accept defaults) and see confirmation of success/failure.  
**Independent Test**: Run exports twice quickly; filenames remain unique; UI surfaces success or actionable error message.

- [x] T018 [US3] Implement filename input/preview in popup allowing override with validation (safe characters) before export.
- [x] T019 [US3] Ensure background deduplicates filenames (appending counter/time) before invoking downloads API to prevent overwrites.
- [x] T020 [US3] Centralize toast/alert component in popup for success/failure reuse, with copy drawn from acceptance criteria.
- [x] T021 [US3] Detect `chrome.runtime.lastError` cases (permissions, downloads blocked) and surface troubleshooting tips per FR-007.

## Phase 6 – Polish & Cross-Cutting
- [x] T022 Add manual verification checklist under `extension/tests/e2e/manual-checklist.md` documenting export/import validation steps.
- [x] T023 Update `specs/001-capture-tab-urls/quickstart.md` with final commands, extension loading instructions, and known limitations.
- [x] T024 Run lint/test (`pnpm lint && pnpm test`) and fix any remaining issues before packaging.

## Dependencies
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 (linear flow)
2. Within Phase 3, T007 must precede T008–T011; background export depends on schema helpers (T005).
3. Phase 4 import tasks (T014–T017) depend on schema validation (T004) and export structures (T012).

## Parallel Execution Opportunities
- After Phase 2, popup UI tasks (T007/T009/T014/T018) can run in parallel with background logic (T008/T012/T016) because they touch separate files.
- Validation/UI feedback tasks (T011/T015/T017/T020/T021) can proceed concurrently once their respective UIs exist.
- Documentation and manual checklist tasks (T022–T023) can run while final bug fixes happen.

## Implementation Strategy
- MVP scope = complete Phase 3 (User Story 1) delivering export-only functionality with success/error messaging.  
- Integrate Phase 4 import + grouping as the next iteration, followed by Phase 5 reliability/polish.  
- Keep shared schema/tests evergreen so both background and popup rely on a single source of truth.

## Task Counts
- Total tasks: 24
- User Story 1 tasks: 5
- User Story 2 tasks: 6
- User Story 3 tasks: 4
- Setup/Foundational/Polish tasks: 9 (3 + 3 + 3)

Independent tests per story align with Spec's acceptance criteria and are restated in each phase description above. MVP recommendation: focus on Phase 3 before proceeding to import/grouping features.

