# Manual Verification Checklist

Use this checklist when testing the Tab Snapshot Logger extension in Chrome.

## Prerequisites
- [ ] Chrome 130+ installed
- [ ] Extension loaded unpacked from `dist/` (after `npm run build`)

## Export Flow (User Story 1)
- [ ] Click the extension icon → popup opens
- [ ] Default filename shows pattern `tabs-export-YYYYMMDD-HHMM.json`
- [ ] Click "Export Tabs" → download prompt appears
- [ ] Confirm download → JSON file saved to downloads folder
- [ ] Open JSON → verify `version`, `captured_at`, `total_tabs`, `windows`, `tabs` present
- [ ] Verify each tab entry has `url`, `title`, `window_id`, `index`

## Tab Groups (User Story 2)
- [ ] Create 2+ tab groups with different colors in Chrome
- [ ] Export tabs → verify `tab_groups` array contains each group with `title`, `color`, `collapsed`
- [ ] Verify `tab_ids` in each group match the tabs that belong to it

## Import Flow (User Story 2)
- [ ] Click "Import Snapshot" → file picker opens
- [ ] Select a previously exported JSON
- [ ] Verify new windows open matching original layout
- [ ] Verify tabs appear in correct order (pinned first)
- [ ] Verify tab groups are recreated with same name/color

## Repeat Use & Messaging (User Story 3)
- [ ] Export twice quickly → filenames remain unique (timestamp differs)
- [ ] Trigger export with invalid filename characters → sanitized automatically
- [ ] Deny download permission → error toast displayed with guidance
- [ ] Import invalid JSON → error toast displayed with schema issue

## Edge Cases
- [ ] Export with only incognito windows → graceful handling (empty or message)
- [ ] Export with unnamed/colorless tab group → group still appears in JSON
- [ ] Import JSON with missing optional fields → no crash, partial restore

---

**Tested by:** _______________  
**Date:** _______________  
**Result:** PASS / FAIL

