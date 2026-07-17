# What's New in VantagePM

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
