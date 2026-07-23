# VantagePM Release Notes

---

## v9.3.0 — July 2026

### Calendar day navigation
Clicking or pressing Enter/Space on a calendar day now navigates directly to the Tasks view, filtered to tasks due on that date. Days with no tasks announce "No tasks due on this date" to JAWS, NVDA, and VoiceOver. Task search also now matches the due-date field, so date-based keyboard filtering works end-to-end.

### WCAG audit: bulk-mark unset criteria
A new **"Mark unset as…"** dropdown and **Apply to Unset** button appear in the audit filter bar. One action marks all criteria that have no status yet as Pass, Fail, Review, or N/A. The count of updated criteria is announced to screen readers via `aria-live`.

### ＋ New Project inside the task modal
A **＋ New** button beside the Project dropdown opens the Add Project dialog without closing the task form. On save, the new project is selected automatically and the task modal stays open so work is uninterrupted.

### Template name pre-fill
Loading a task template no longer appends "(copy)" to the name. The task name pre-fills with the template name so users can edit or keep it without extra cleanup.

### Session summary: opt-in read-aloud
Auto-read-aloud has been removed from session summary open. Text-to-speech now only fires when you press **Read Aloud** explicitly, preventing it from conflicting with an active JAWS or NVDA session.

### JAWS virtual cursor fix
Added `role="application"` to the main `#app` container. JAWS now enters application mode (PC cursor) automatically when focus enters the app, eliminating the need to toggle virtual cursor off manually with Insert+Z. Modals (`role="dialog"`, `role="alertdialog"`) sit outside `#app` and are unaffected.

---

## v9.2.0 — July 2026

### Tester persona sees Quick Setup
The Accessibility Tester persona can now see the Quick Setup section on the Onboarding page, allowing testers to re-seed sample data without changing their role.

### Role-change warning alertdialog
Switching away from the Tester persona now shows a warning `role="alertdialog"` before proceeding: explains the workspace will be replaced and advises checking with a project lead or administrator if unsure. Cancel keeps the current persona; Change Role proceeds.

### Done button on the Due Today widget
Every task in the Dashboard **Due Today** widget now has a green **Done** button for marking completion without opening the edit modal. Recurring tasks schedule their next recurrence automatically and announce the new due date to screen readers.

### Mark 100% button in task modal
A **Mark 100%** button appears beside the progress slider in the task modal — one click instead of 20 arrow-key presses to reach 100 percent.

### Author pre-fill in task forms
Comment author and time-log person fields now pre-fill with the Focus Mode User name when opening Add Task or Edit Task, saving repetitive typing.

### Log Time in the Tasks view
A **Log Time** button has been added to the Tasks view filter bar so batch time logging is reachable from Tasks as well as Reports.

---

## v9.1.0 — July 2026

### Undo for destructive actions
Deleting a task, project, milestone, or team member now shows an **Undo** button in the toast notification. Press it within 5 seconds to restore everything exactly as it was — including related tasks when a project is deleted. Bulk delete also supports undo. The undo button is keyboard-focusable and announced to screen readers.

### Batch time log
A **Log Time** button on the Reports page opens a dialog listing all open tasks for a selected person and date. Enter hours (and an optional note) for each task in one go; hours round up to the nearest 15 minutes (billing style). Changing the Person dropdown refreshes the task list live via `aria-live`.

### WCAG audit print report
The Audit page now has a **Print Report** button alongside Export CSV. It opens a clean, print-ready HTML document in a new window showing:
- Pass rate percentage and summary counts (Pass, Fail, Review, N/A, Not Set)
- Full criteria table with colour-coded result badges and notes
- Print / Save as PDF button styled for the printed page

Uses `window.open` + `document.write` — no server or library required.

### Alt+1–9 keyboard shortcuts for filter presets
Each saved filter preset now has a keyboard shortcut: **Alt+1** loads the first preset, up to **Alt+9** for the ninth. The shortcut label is displayed on each preset chip; screen reader users hear it in the button's accessible name.

### Escape closes row action menus
Pressing Escape while a task-row Actions menu (⋮) is open closes it and returns focus to the trigger button. Previously Escape only closed modals.

### Expanded search
- Task filter search now matches task description and comment text in addition to name and assignee.
- Global search (Alt+/) now includes project notes, project description, member department, and member email.

### JavaScript extracted to renderer.js
All JavaScript moved from `index.html` into a dedicated `src/renderer/renderer.js` file. `index.html` now contains only HTML structure and CSS. `audit.py` updated to validate `renderer.js` for all JS checks.

---

## v9.0.0 — July 2026

### Persona setup wizard
On first launch, a non-dismissable setup modal captures role and name before entering the app. Four role options seed different sample data automatically:

| Role | Pre-loaded data |
|------|----------------|
| Accessibility Tester | 1 audit project, 5 test tasks, 2 templates, 2 filter presets |
| Project Lead | 4 team members, 2 projects, distributed tasks, milestones, 3 presets |
| Project Manager | 5 members, 3 projects, time logs, milestones, 4 presets |
| Blank Slate | No sample data |

Your name saves as the Focus Mode User automatically. Re-apply a different persona any time from the Setup Guide (Onboarding) page.

### Filter presets
Save any combination of status, priority, project, and search filters as a named preset. A preset bar renders above the task table; `aria-pressed` on each chip reflects the active preset for screen readers. Alt+1–9 shortcuts load presets by position (added in v9.1.0).

### Task pinning
Pin any task to keep it anchored at the top of the list regardless of sort order. A pin button (📍/📌) appears in the Actions column. `aria-pressed` reflects pin state for JAWS and NVDA; toggling announces "pinned to top" or "unpinned" via `aria-live`.

### CSV import
Import tasks from any CSV file. Supported columns (case-insensitive): `name`, `project`, `assignee`, `priority`, `status`, `due`, `progress`, `recurring`. Projects and members referenced in the CSV are created automatically if missing. Natural language due dates, quoted fields, and Windows/Mac/Unix line endings all handled.

### Team view redesigned
Team page redesigned as a sortable table with `scope="col"` headers. Project Leads and Managers see an Actions menu (⋮) per row; the **Change Role modal** (`role="dialog"`, `aria-modal`, focus trap) lets them update team member role titles directly.

### Accessibility notes (v9.0.0)
- Setup modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`. Non-dismissable — pressing Escape announces "Please complete setup to continue."
- All new modals follow the same pattern: `role="dialog"`, `aria-modal`, `aria-labelledby`, `trapFocus()`, focus return on close.
- Destructive role replacement goes through `role="alertdialog"` before resetting data.
- Row action menu: `role="menu"` / `role="menuitem"`, `aria-haspopup`, `aria-expanded`, keyboard-accessible focus management.

---

## v8.1

- Add Task button fixed — stale `_openAddTask_v6` alias removed.
- All decorative emoji in the UI wrapped in `<span aria-hidden="true">` to silence screen readers.

---

## v8.0.0

- Role-based views (Tester, Lead, Manager, Admin personas).
- Priority escalation — tasks approaching their due date auto-escalate priority.
- Time goals per project — set hour targets and track against them in Reports.
- End-of-day checklist modal.
- Velocity tracking in Reports.

---

## v7.4

- Script block moved to before `</body>` — confirmed working in production build.

---

## v7.0.0

- Project health dashboard — per-project health indicators (Healthy / At Risk / Critical) with task counts, overdue tallies, and aging alerts.
- Time summary — logged hours by person and project in the Reports view.
- Task aging alerts — tasks with no update in N days show a "stale" badge.
- Workload balancing — availability bars per team member in the Team view.
- Team notes — per-project notes panel with author and timestamp.
- Screen reader conflict detector — warns when two accessibility tools are likely active simultaneously.
- Session summary modal — end-of-session recap of completed tasks and logged time.

---

## v6.0.0

- Task timer — live stopwatch per task with 15-minute billing rounding. Stop & Log adds a time entry automatically.
- Quick capture — Alt+Q opens a minimal one-field capture modal for rapid task entry.
- Natural language due dates — type "next Friday", "in 2 weeks", "tomorrow" in the due date field.

---

## v5.1

- Theme switching fixed — dark/light/high-contrast toggle now persists correctly across navigation.
- Onboarding copy updated to be organisation-agnostic (removed company-specific references).

---

## v5.0.0

- Settings Save/Cancel bar — all settings changes stage in memory; a sticky bar shows until you save or cancel.
- Task templates — save any task as a reusable template; load templates from the Add Task modal.
- Custom statuses — add, rename, and reorder task statuses beyond the built-in To Do / In Progress / Done set.
- Bulk actions — select multiple tasks via checkboxes; apply status changes, reassignment, or deletion in one step.
- Color labels — assign a colour to any task for at-a-glance visual grouping.
- Onboarding wizard — first-run welcome flow with step-by-step setup guidance.
