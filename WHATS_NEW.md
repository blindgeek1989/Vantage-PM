# What's New in VantagePM

## v9.1.0 — Undo, Batch Time Log, WCAG Print Report, Preset Shortcuts, Search Enhancements

### Undo for Destructive Actions
Deleting a task, project, milestone, or team member now shows an **Undo** button in the toast notification. Press it within 5 seconds to restore everything exactly as it was (including related tasks when a project is deleted). Bulk delete also supports undo. The undo button is keyboard focusable and announced to screen readers with "Activate to undo last deletion."

### Batch Time Log
A new **Log Time** button on the Reports page opens a dialog listing all open tasks for a selected person and date. Enter hours (and an optional note) for each task in one go — no need to open individual tasks. Hours are rounded up to the nearest 15 minutes (billing style), matching the existing timer. The date field defaults to today; changing the Person dropdown refreshes the task list live.

### WCAG Audit Print Report
The Audit page now has a **Print Report** button alongside Export CSV. It opens a clean, print-ready HTML document in a new window showing:
- Pass rate percentage and summary counts (Pass, Fail, Review, N/A, Not Set)
- Full criteria table with colour-coded result badges and your notes
- A "Print / Save as PDF" button styled for the printed page

Uses `window.open` + `document.write` — no server or library required. Works with any browser's built-in PDF printer.

### Alt+1–9 Keyboard Shortcuts for Filter Presets
Each saved filter preset now has a keyboard shortcut: **Alt+1** loads the first preset, **Alt+2** the second, and so on up to **Alt+9**. The shortcut label is displayed in small text on each preset chip so sighted users can see it at a glance. Screen reader users hear the shortcut in the button's accessible name.

### Escape Now Closes Row Action Menus
Pressing Escape while a row action menu (⋮ Actions) is open closes it and returns focus to the trigger button. Previously Escape only closed modals; row menus required a mouse click outside to dismiss.

### Expanded Search
- **Task filter search** (Tasks view) now matches against task description and comment text in addition to task name and assignee.
- **Global search** (Alt+/) now includes project notes in results. Matching notes show the note excerpt and the project name, and activating the result opens the project's notes panel.
- **Global search** also now matches member department and email, and project description text.

### Time Summary Fixed
The time tracking summary section was being generated but discarded in Reports due to a JS expression precedence bug. It now correctly appears at the bottom of the Reports page.

### Architecture: JS Split to renderer.js
All JavaScript has been extracted from `index.html` into a dedicated `src/renderer/renderer.js` file. `index.html` now contains only HTML structure and CSS. This makes both files independently editable — a bad JS change can no longer corrupt the HTML, and vice versa.

`audit.py` has been updated to read `renderer.js` for all JS checks (brace balance, duplicates, key functions, etc.) while still validating `index.html` structure and CSP.

---

## v9.0.0 — Persona Setup, Filter Presets, Task Pinning, CSV Import

### Persona Setup Wizard
On first launch, a non-dismissable setup modal walks you through two required steps before entering the app: selecting your role and entering your name. The four role options are:

- **Accessibility Tester** — Solo auditor. Pre-loads one audit project, five test tasks, two templates, and two saved filter presets.
- **Project Lead** — Leading a small remediation team. Pre-loads four team members, two projects, distributed tasks, milestones, and three saved filter presets.
- **Project Manager** — Managing multiple programs. Pre-loads five team members, three projects, time logs, milestones, and four saved filter presets.
- **Blank Slate** — No sample data. Start fresh.

Your name is saved as the Focus Mode User automatically during setup.

You can re-apply a different persona at any time from the Setup Guide (onboarding) page — Project Leads and Managers see a "Quick Setup" section at the top with the same role cards.

### Filter Presets
Save any combination of status, priority, project, and search filters as a named preset.

- Click **Save Preset** in the Tasks toolbar to name and save your current filters.
- A **preset bar** appears above the task table listing all saved presets. Click a preset chip to apply it instantly.
- Each preset chip has a separate **✕ delete button** so you can remove presets without loading them first.
- Presets are saved locally and synced to Google Drive along with your other data.
- `aria-pressed` on each chip reflects the currently active preset for screen readers.

### Task Pinning
Pin any task to keep it anchored to the top of your task list regardless of current sort order.

- A **pin button** (📍/📌) appears in the Actions column of every task row.
- Toggling the pin announces "pinned to top" or "unpinned" via `aria-live`.
- `aria-pressed` reflects pin state for JAWS and NVDA users.
- Pinned state is saved with your task data and synced via Google Drive.

### CSV Import
Import tasks from any CSV file directly into VantagePM.

- Click **Import CSV** in the Tasks toolbar.
- Supported columns (case-insensitive headers): `name`, `project`, `assignee`, `priority`, `status`, `due`, `progress`, `recurring`.
- Projects and team members referenced in the CSV are created automatically if they don't already exist.
- Duplicate header detection, quoted field support, and Windows/Mac/Unix line endings all handled.
- Natural language due dates (e.g., "next Friday", "in 2 weeks") are parsed using the existing natural date engine.
- Import results are announced via `aria-live` and shown in a toast.

### Team View Redesigned
The Team page now uses a **sortable table layout** instead of cards for better screen reader navigation and density.

- All member data (name, role, department, email, task counts) is in a proper `<table>` with `scope="col"` headers.
- Project Leads and Managers with tester-role members see an **Actions menu** (⋮) per row for role changes.
- The **Change Role modal** lets leads and managers update a team member's role title directly from the team table.
- Workload availability bars remain above the table as a summary section.

### Onboarding / Setup Guide Updates
- Step 5 updated to mention task pinning.
- Step 6 updated to mention filter presets and CSV import.
- The page title changed from "Welcome" to "Setup Guide" to better reflect its ongoing utility.

### Accessibility Notes (all changes)
- Setup modal uses `role="dialog"` with `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` on the intro paragraph.
- Setup modal is non-dismissable via Escape — pressing Escape while it is open announces "Please complete setup to continue." so screen reader users understand why the dialog did not close.
- All new modals (Change Role, Save Filter Preset) follow the same pattern: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap via `trapFocus()`, and focus return to trigger on close.
- Destructive role replacement goes through the existing `confirm-modal` (`role="alertdialog"`) before resetting data.
- Row action menu uses `role="menu"` / `role="menuitem"` with `aria-haspopup`, `aria-expanded`, and keyboard-accessible focus management.
- Clicking anywhere outside an open row menu closes it via a document-level click listener.
- All decorative emoji in new UI elements use `<span aria-hidden="true">`.

### Google Drive Sync
- Filter presets and persona are now included in Drive sync payloads and local saves.
- Drive write version bumped to `9.0.0`.

---

## Previous Versions

| Version | Summary |
|---------|---------|
| v8.1    | Add Task button fixed (stale alias removed), all decorative emoji hidden from screen readers |
| v8.0.0  | Role-based views, priority escalation, time goals per project, end of day checklist, velocity tracking |
| v7.4    | Script block moved to before `</body>` — confirmed working build |
| v7.0.0  | Project health dashboard, time summary, task aging alerts, workload balancing, team notes, SR conflict detector, session summary |
| v6.0.0  | Task timer with 15-min billing rounding, quick capture, natural language due dates |
| v5.1    | Theme switching fix, onboarding copy updated to be organization-agnostic |
| v5.0.0  | Settings Save/Cancel, task templates, custom statuses, bulk actions, color labels, onboarding |
