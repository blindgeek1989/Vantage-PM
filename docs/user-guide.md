# VantagePM User Guide

**Version 9.7.1**
**Published by Aaron Linson**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installation](#2-installation)
3. [First Launch and Onboarding](#3-first-launch-and-onboarding)
4. [Getting Around](#4-getting-around)
5. [Tasks](#5-tasks)
6. [Projects](#6-projects)
7. [Milestones](#7-milestones)
8. [Calendar](#8-calendar)
9. [Team](#9-team)
10. [Reports](#10-reports)
11. [WCAG Audit (Digital Accessibility Mode Only)](#11-wcag-audit-digital-accessibility-mode-only)
12. [Dashboard](#12-dashboard)
13. [Focus Mode](#13-focus-mode)
14. [Google Drive Sync](#14-google-drive-sync)
15. [Settings](#15-settings)
16. [Keyboard Shortcuts Reference](#16-keyboard-shortcuts-reference)
17. [Screen Reader Quick-Start](#17-screen-reader-quick-start)
18. [Accessibility Features Summary](#18-accessibility-features-summary)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Introduction

VantagePM is a desktop project management application built specifically for digital accessibility professionals and the teams that work with them, as well as professionals in other project management industries. It runs on Windows and macOS. It was designed from the ground up to be fully usable with screen readers, keyboard-only navigation, and other assistive technologies.

### Who This App Is For

VantagePM is made for:

- Accessibility auditors and testers who need to track WCAG 2.2 criteria alongside their project work
- Project managers and team leads at organizations with accessibility programs
- Mixed teams where some members use screen readers, voice control, or other assistive technology
- Anyone who wants a project management tool that does not fight their assistive technology

### App Modes

VantagePM offers two modes, chosen during onboarding:

- **Digital Accessibility mode**: The full feature set, including the built-in WCAG 2.2 audit tool.
- **Project Management mode**: The same app, but with the WCAG Audit tab hidden. This is a good choice for teams that handle project tracking but not the audit work itself.

App mode is set during onboarding and cannot be changed from within the app. Contact Aaron Linson if you need to switch modes after setup.

### System Requirements

**Windows:**
- Windows 10 or Windows 11 (64-bit)
- 200 MB free disk space
- Internet connection required only for Google Drive sync (optional)

**macOS:**
- macOS 11 (Big Sur) or later
- 200 MB free disk space

### Screen Reader Compatibility

VantagePM is tested with:

- JAWS (Freedom Scientific) on Windows
- NVDA (NV Access) on Windows
- VoiceOver on macOS

---

## 2. Installation

### Windows

1. Download the installer file named `VantagePM Setup X.X.X.exe` (where X.X.X is the version number).
2. Open File Explorer and navigate to your Downloads folder. Or press Windows+D to go to the desktop, then open the file from there.
3. Double-click the installer file, or press Enter when it is focused.
4. Windows may show a security prompt. Select "Run anyway", "More info", or "Learn more" and then "Run anyway" if the installer is blocked.
5. Follow the on-screen installer prompts. You can accept the default installation location.
6. When installation is complete, VantagePM will appear in your Start menu and as a desktop shortcut.

**Important for developers and testers:** Always run the installer before testing. Do not test from the unpacked folder in the `dist` directory — behavior may differ.

### macOS

1. Download the `.dmg` file.
2. Open the `.dmg` file.
3. Drag VantagePM to your Applications folder.
4. Open VantagePM from your Applications folder. On first launch, macOS may ask you to confirm you want to open an app from the internet. Click "Open."

---

## 3. First Launch and Onboarding

When you launch VantagePM for the first time, a welcome wizard appears. This wizard has two tabs.

### Tab 1: Choose Your Mode

The first tab asks you to choose your app mode:

- **Digital Accessibility**: Select this if your team does WCAG audits or if you want access to all features.
- **Project Management**: Select this if your team manages accessibility projects but does not need the built-in audit tool, or wants to use VantagePM in any other industry.

Press Tab to move between the two mode options, then press Space or Enter to select one. Choose carefully — app mode is set here and cannot be changed from within the app after onboarding.

### Tab 2: Your Profile

The second tab asks for your name and role. This information is used to pre-fill task fields and to set up your profile for team features.

If you are a tester or developer setting up a demo environment, look for the "Quick Setup" button. It pre-populates your profile with sample data so you can explore all features without manual data entry.

### Finishing the Wizard

Press the "Get Started" or "Finish" button to complete onboarding. Your mode is saved and you will not see the wizard again unless you reset the app.

---

## 4. Getting Around

### The Navigation Sidebar

VantagePM has a persistent sidebar on the left side of the window. The sidebar contains navigation buttons for each section of the app. Each button also has a keyboard shortcut.

The navigation items are:

- Dashboard (Alt+1)
- Tasks (Alt+2)
- Calendar (Alt+3)
- Team (Alt+4)
- Reports (Alt+5)
- Projects (listed under the Tasks area)
- Milestones
- Templates
- WCAG Audit (appears only in Digital Accessibility mode)
- Settings (Alt+Comma)

The sidebar has `role="navigation"` so screen reader users can jump to it using landmark navigation.

### The Main Content Area

The main content area is to the right of the sidebar. It has `role="document"`, which means JAWS and NVDA users can use their virtual cursor (reading mode) navigation keys directly in this area. You do not need to manually switch modes to read the content. You can press H to move by headings, B to move by buttons, and so on.

### Skip Links

Two skip links appear at the very top of the page and become visible when they receive keyboard focus:

- **Skip to navigation**: Moves focus to the top of the sidebar.
- **Skip to main content**: Moves focus to the top of the main content area.

To use them, press Tab when the app first loads (or after refreshing focus to the top of the window). The skip links appear first in the tab order.

### Keyboard Navigation Basics

Press Tab to move forward through interactive elements. Press Shift+Tab to move backward. Press Enter or Space to activate buttons. In text fields, type normally and press Tab to move to the next field.

Press Escape to close a modal or dismiss a menu.

### Keyboard Shortcuts Table

See the full shortcuts reference in [Section 16](#16-keyboard-shortcuts-reference).

### Screen Reader Navigation Tips

#### JAWS (Windows)

The main content area uses `role="document"`, so JAWS automatically allows virtual cursor navigation in that area. You can:

- Press **H** to move to the next heading, **Shift+H** to move back.
- Press **B** to move to the next button, **Shift+B** to move back.
- Press **R** to move to the next landmark region, **Shift+R** to move back.
- Press **F** to move to the next form field, **Shift+F** to move back.
- Press **T** to move to the next table, **Shift+T** to move back.
- Press **Insert+Down Arrow** to read all content from the current position.
- Press **Insert+Up Arrow** to read the current line.
- Press **Insert+Z** to toggle between Virtual Cursor mode and Application mode if needed.

To jump directly to the navigation sidebar, press **R** to move to the next landmark region until you reach the navigation region, or use the JAWS Landmark dialog.

#### NVDA (Windows)

The main content area uses `role="document"`, so NVDA's browse mode is active there by default. You can:

- Press **H** to move to the next heading, **Shift+H** to move back.
- Press **B** to move to the next button, **Shift+B** to move back.
- Press **D** to move to the next landmark, **Shift+D** to move back.
- Press **F** to move to the next form field, **Shift+F** to move back.
- Press **T** to move to the next table, **Shift+T** to move back.
- Press **NVDA+Down Arrow** to read all content from the current position. (NVDA key is usually Insert or Caps Lock, depending on your NVDA settings.)
- Press **NVDA+Up Arrow** to read the current line.
- Press **NVDA+Space** to toggle between Browse mode and Focus mode when interacting with controls that require it.

#### VoiceOver (macOS)

The VO key combination is Control+Option. This guide abbreviates it as VO throughout.

- Press **VO+Command+H** to move to the next heading, **VO+Command+Shift+H** to move back.
- Press **VO+Command+L** to move to the next landmark.
- Press **VO+Command+J** to move to the next form control.
- Press **VO+Right Arrow** to move to the next item.
- Press **VO+Space** or **VO+Return** to activate the focused item.
- Press **VO+A** to read all content from the current position.
- Press **VO+Shift+Down Arrow** to enter (interact with) a group or region. Press **VO+Shift+Up Arrow** to exit it.

---

## 5. Tasks

Tasks are the core of VantagePM. You can create, edit, filter, sort, and manage tasks from the Tasks view (Alt+2).

### Creating a Task

1. Press **Alt+N** (New Task) from anywhere in the app, or navigate to the Tasks view and activate the "Add Task" button.
2. A dialog opens with the label "Add Task" (role="dialog", aria-modal="true"). Focus moves into the dialog automatically.
3. Fill in the following fields:
   - **Task Name** (required): A short, descriptive name.
   - **Description**: Optional. More detail about what needs to be done.
   - **Project**: Assign the task to a project. Use the dropdown to select from existing projects.
   - **Assignee**: The team member responsible for this task.
   - **Priority**: High, Medium, or Low.
   - **Status**: The current state (To Do, In Progress, Done, or any custom statuses you have created).
   - **Due Date**: Accepts natural language input (for example, "next Friday" or "Aug 15").
   - **Recurring**: Optional. Set the task to recur daily, weekly, or monthly.
   - **Color Label**: Optional. A color for visual grouping.
   - **Progress**: A percentage from 0 to 100.
4. Press **Alt+S** or activate the "Save" button to save the task. Or press **Escape** to cancel and return focus to the trigger element.

If any required fields are missing, an error message appears with `role="alert"` so your screen reader announces it automatically.

### Editing a Task

1. In the Tasks table, navigate to the task you want to edit.
2. Activate the "Edit" button for that task (or press Enter on the task row if it is focusable as a row).
3. The Edit Task dialog opens, pre-filled with the existing data.
4. Make your changes and press **Alt+S** or activate "Save."

### Deleting a Task

1. Activate the "Delete" button for the task.
2. A confirmation dialog appears with `role="alertdialog"` (this is the destructive action dialog). JAWS and NVDA will announce it immediately.
3. Confirm or cancel.
4. After deletion, a toast notification appears with an "Undo" button. You have a short window to undo the delete. The announcement is read by your screen reader via the live region.

### Cycling Task Status

Each task row in the table has a Status button that shows the current status. Press it once to cycle to the next status in your workflow. This is a fast way to update status without opening the full Edit dialog. The new status is announced via the live region.

### Filtering Tasks

You can filter the task list by:

- **Status**: Filter to show only tasks with a specific status.
- **Priority**: Filter to High, Medium, or Low.
- **Project**: Show tasks for a specific project only.

Filter controls appear above the task table. After applying a filter, the number of matching tasks is announced.

You can also **save a filter preset**. Set your filters, then activate the "Save Preset" button and give it a name. Saved presets appear in a dropdown so you can reapply them quickly.

### Searching Tasks

Press **Alt+F** to focus the search field. Type your search term. The app searches task names, assignees, descriptions, comments, and due dates. Results update as you type.

### Sorting Tasks

Table column headers are buttons. Activate a column header to sort by that column. Activate it again to reverse the sort order. The current sort direction is indicated by `aria-sort="ascending"` or `aria-sort="descending"` on the column header, which your screen reader will announce.

Sortable columns include:
- Task Name
- Assignee
- Priority
- Status
- Due Date

### Bulk Actions

To act on multiple tasks at once:

1. Use the checkboxes in the task table to select tasks. Each checkbox has a label identifying the task.
2. When one or more tasks are selected, a bulk actions toolbar appears.
3. From the toolbar, you can:
   - Change status for all selected tasks
   - Reassign all selected tasks to a different team member
   - Delete all selected tasks

The number of selected tasks is announced when the toolbar appears.

### Pinning Tasks

Activate the "Pin" button on any task to pin it to the top of the task list. Pinned tasks remain at the top regardless of current sort order. Activate "Unpin" to remove the pin.

### Task Timer

Each task has a built-in timer for tracking time spent.

1. In the task row or the Edit Task dialog, activate the "Start Timer" button.
2. The timer runs in the background. A status announcement confirms the timer has started.
3. Activate "Stop Timer" when you finish. The elapsed time is automatically rounded to the nearest 15 minutes for billing purposes.
4. The logged time is added to the task's time record.

### Logging Time Manually

In the Tasks view or the Edit Task dialog, activate "Log Time." Enter the number of hours and minutes. This adds to the task's time record without using the live timer.

You can also use the batch time log feature to log the same time block to multiple tasks at once using bulk actions.

### Recurring Tasks

When you set a task to recur (daily, weekly, or monthly), marking that task as "Done" automatically creates the next occurrence with the appropriate due date. The new task is announced via the live region.

### CSV Import and Export

**Exporting:**
1. Go to the Tasks view.
2. Activate the "Export CSV" button.
3. A CSV file is saved to your Downloads folder (or your browser's default download location). The file contains all current tasks with all their fields.

**Importing:**
1. Activate the "Import CSV" button.
2. Select a CSV file. The expected column order matches the export format.
3. Imported tasks are added to your existing task list. A count of imported tasks is announced.

---

## 6. Projects

Projects group your tasks. Go to the Projects view from the sidebar.

### Creating a Project

1. Activate the "New Project" button. You can also create a new project directly from the Add Task or Edit Task dialog without leaving the task.
2. Enter a project name, optional description, and choose a color for the project.
3. Save the project. It immediately appears in project dropdowns throughout the app.

### Viewing Project Health

Each project in the Projects list shows a health dashboard with:

- A progress bar showing the percentage of tasks completed (uses `role="progressbar"` with accessible labels).
- Status indicators for open tasks, overdue tasks, and milestones.
- A count of tasks by status.

### Project Notes

Each project has a Notes field. Open a project and look for the Notes section to add free-form notes that apply to the project as a whole, not to any specific task.

---

## 7. Milestones

Milestones mark important dates or deliverables within a project.

### Creating a Milestone

1. Navigate to the Milestones view from the sidebar.
2. Activate "New Milestone."
3. Enter a name, link it to a project, and set a date.
4. Save.

### Viewing Milestones

Milestones appear in two places:

- **Dashboard**: The "Upcoming Milestones" widget shows milestones due in the next 14 days.
- **Calendar**: Milestones appear on their due date in the calendar month view.

---

## 8. Calendar

The Calendar view (Alt+3) shows tasks and milestones on a monthly grid.

### Navigating the Calendar

- Use the **Prev** and **Next** buttons above the calendar to move between months.
- The calendar grid uses `role="application"` with instructions for keyboard navigation.
- Press the **Arrow keys** to move between days within the calendar.
- Press **Enter** on a day to filter the Tasks view to show only tasks due on that date. This takes you to the Tasks view with the filter applied.

### Screen Reader Notes for Calendar

The calendar is marked as `role="application"`. This means:

- **JAWS** switches to Application mode automatically when focus enters the calendar. Use arrow keys to navigate days. To return to virtual cursor navigation after leaving the calendar, press **Insert+Z** if needed.
- **NVDA** switches to Focus mode when you enter the application region. Press **NVDA+Space** to return to Browse mode after you leave the calendar.
- **VoiceOver**: Use **VO+Shift+Down Arrow** to enter the calendar region, navigate with arrow keys, and **VO+Shift+Up Arrow** to exit the region.

Each day cell is labeled with the date and a count of items due on that day, so you can identify busy days without activating each one.

---

## 9. Team

The Team view (Alt+4) shows your team members and their workload.

### Adding a Team Member

1. Activate "Add Member."
2. Enter: name, role, department, email address.
3. Save. The member appears in the team table and becomes available in task assignee dropdowns.

### Reading the Workload Table

The team table shows each member's:

- Name
- Role
- Department
- Email (as a clickable link)
- Open task count vs. their maximum workload setting
- A workload indicator (full, under capacity, over capacity)

Progress indicators use `role="progressbar"` with accessible labels so screen readers announce the values.

### Roles and Permissions

Certain roles can change the roles of other team members. Roles with this permission include: lead, manager, pm-lead, and pm-manager. Members with standard roles can update their own profile but cannot change other members' roles.

When changing another member's role, a confirmation dialog appears to prevent accidental changes.

---

## 10. Reports

The Reports view (Alt+5) shows aggregated data about your tasks and team.

### Task Reports

The Reports view shows:

- **Breakdown by status**: How many tasks are in each status. Shown as progress bars with text values. The ARIA markup ensures screen readers can read both the percentage and the count.
- **Breakdown by priority**: Task counts for High, Medium, and Low priority.

### Per-Member Stats

For each team member, the Reports view shows:

- Number of tasks assigned
- Number of tasks completed (Done status)
- Completion rate (percentage)
- Total hours logged

### Time Summary

A time summary section shows logged hours aggregated across all tasks and team members for the current period.

### Exporting Reports

Use the export options in the Reports view to export data as CSV for use in spreadsheets or other tools.

---

## 11. WCAG Audit (Digital Accessibility Mode Only)

The WCAG Audit view is available only in Digital Accessibility mode. It contains all 78 WCAG 2.2 success criteria at Levels A and AA.

### Navigating the Criteria List

Each criterion is displayed with its:

- ID (for example, 1.1.1, 2.4.3)
- Name
- Level (A or AA)
- Current result (Pass, Fail, Review, N/A, or unset)
- Notes field

Use heading navigation to move through the criteria list. Each criterion heading includes the ID and name.

### Marking a Criterion

For each criterion, use the result buttons to mark it:

- **Pass**: The product meets this criterion.
- **Fail**: The product does not meet this criterion.
- **Review**: Needs further investigation.
- **N/A**: This criterion does not apply to the product being tested.

Your screen reader announces the new status when you activate a button.

### Adding Notes to a Criterion

Each criterion has a text field for notes. Enter any observations, bug references, or testing details. Notes are saved with the criterion.

### Searching Criteria

Use the search field to find a criterion by its ID number or by keywords in its name. For example, searching "1.1.1" or "non-text content" both find the same criterion.

### Filtering by Result

Use the filter dropdown above the criteria list to show only criteria with a specific result status (Pass, Fail, Review, N/A, or unset). This is useful for focusing on outstanding items.

### Bulk Mark Unset

Activate the "Bulk Mark Unset" button to change all criteria that have not yet been marked to a status of your choice. This is useful when most criteria are N/A (for example, when testing a very focused component) and you want to quickly set a baseline.

### Exporting the Audit

Activate "Export CSV" to download the full audit as a spreadsheet with all criteria, results, and notes.

### Printing the Audit Report

Activate "Print Report" to open a print-ready view of the audit. This view is formatted for paper or PDF output and includes all criteria and their results.

---

## 12. Dashboard

The Dashboard (Alt+1) gives you a quick overview of your current work.

### What Is on the Dashboard

- **Tasks Due Today**: A widget listing tasks with a due date of today. Each task has "Done" and "Edit" buttons directly in the widget so you can act quickly without navigating to the Tasks view.
- **Upcoming Milestones**: Milestones due in the next 14 days, listed with their project and date.
- **Stats Summary**: Shows total tasks, tasks To Do, In Progress, Done, Overdue, and average progress across all tasks.
- **Recent Tasks**: A table of the five most recently created or modified tasks.

### Daily Briefing (Alt+B)

Press **Alt+B** from anywhere in the app to open the Daily Briefing. This feature summarizes:

- Tasks due today
- Overdue tasks
- Upcoming milestones

The briefing text is shown in a dialog. If you have the text-to-speech option enabled in Settings, the app reads the briefing aloud using your system's built-in speech synthesis. This is separate from your screen reader and provides an additional audio channel for a quick audio summary.

---

## 13. Focus Mode

Focus Mode filters all views to show only tasks assigned to a specific team member.

### Setting Up Focus Mode

1. Go to Settings > General.
2. Set the "Focus Mode User" to the team member whose tasks you want to focus on.

### Activating Focus Mode

Press **Alt+W** to toggle Focus Mode on or off. When Focus Mode is active, a status announcement confirms it is on, and all views filter to show only the designated user's tasks.

Press **Alt+W** again to turn Focus Mode off and return to the full task list.

---

## 14. Google Drive Sync

VantagePM can sync your data to a Google Drive folder as a JSON file. This is optional but useful for backup, sharing access across devices, or team collaboration on the same data file.

### Setting Up Google Drive Sync

1. Go to **Settings > Drive**.
2. Activate "Sign in with Google." Your default browser opens a Google OAuth page.
3. Sign in with your Google account and grant VantagePM permission to access your Drive.
4. After authorizing, return to VantagePM. The Drive settings panel shows your account.
5. Activate "Select Folder" and choose or create a folder in your Drive where the data file will be stored.
6. The app saves your data as `accesspm-data.json` in the chosen folder.

Google sign-in and folder selection save immediately. You do not need to use the Save button for these actions.

### Syncing Your Data

- **Manual sync**: Press **Alt+R** from anywhere in the app to sync immediately.
- **Automatic sync**: In Settings > Drive, set a sync interval (for example, every 5 minutes, every 15 minutes). The app syncs in the background at that interval.

A status announcement confirms when sync completes or if an error occurs.

### Signing Out of Google Drive

1. Go to **Settings > Drive**.
2. Activate "Sign Out." This revokes VantagePM's access to your Google account. Your local data is not deleted.

---

## 15. Settings

Access Settings with **Alt+Comma** or by activating the Settings button in the sidebar.

Settings are organized into tabs. Navigate between tabs using Tab (to move to tab list) and then arrow keys or Tab to move between tabs.

**Important:** Most settings changes are not saved until you activate the "Save" button. When you make a change, a Save/Cancel bar appears at the bottom of the settings panel. Activate "Save" to commit changes, or "Cancel" to revert all pending changes.

Exceptions that save immediately (no Save button needed):
- Google Drive sign-in and sign-out
- Google Drive folder selection

### General Tab

- **Current User Name**: Your name as it appears in the app. Used to pre-fill task fields.
- **Date Format**: Choose how dates are displayed throughout the app (for example, MM/DD/YYYY or DD/MM/YYYY).
- **Remind Lead Days**: How many days before a due date the app shows a reminder.
- **Confirm on Delete**: When enabled, a confirmation dialog appears before any delete action. When disabled, deletes happen immediately (though undo is still available).
- **Auto-Sync**: Enable or disable automatic Google Drive sync.
- **Focus Mode User**: The team member whose tasks are shown when Focus Mode is active.

### Appearance Tab

- **Theme**: Choose from Light, Dark, System (follows your OS setting), or High Contrast.
- **Font Size**: A slider to increase or decrease the font size throughout the app.

Changing the theme or font size takes effect immediately so you can see the result while you are still in settings. These changes are still pending until you save.

### Accessibility Tab

- **Reduce Motion**: When enabled, the app minimizes animations and transitions. Recommended for users with vestibular disorders or who prefer less visual motion.

### Drive Tab

See [Section 14, Google Drive Sync](#14-google-drive-sync) for full details.

### Shortcuts Tab

All keyboard shortcuts are listed here. To change a shortcut:

1. Navigate to the shortcut you want to change.
2. Activate the input field for that shortcut.
3. Press the key combination you want to use.
4. If the combination conflicts with another shortcut, the app shows a conflict warning.
5. Save your changes.

### Statuses Tab

You can add custom task statuses in addition to the defaults (To Do, In Progress, Done).

1. Activate "Add Status."
2. Enter a name and choose a color.
3. Save immediately (the Statuses tab saves when you activate Add or Delete, without needing the main Save button).

To remove a custom status, activate the "Delete" button next to it.

### Notifications Tab

Toggle reminder notifications on or off. When enabled, the app shows a system notification before a task is due, based on the Remind Lead Days setting.

### About Tab

Shows the current app version, release date, and a brief changelog. Useful for confirming which version you have installed when reporting issues.

---

## 16. Keyboard Shortcuts Reference

All shortcuts are customizable in Settings > Shortcuts.

| Action | Default Shortcut |
|---|---|
| Go to Dashboard | Alt+1 |
| Go to Tasks | Alt+2 |
| Go to Calendar | Alt+3 |
| Go to Team | Alt+4 |
| Go to Reports | Alt+5 |
| Go to Settings | Alt+Comma |
| New Task | Alt+N |
| Save item | Alt+S |
| Close modal or dismiss menu | Escape |
| Search tasks | Alt+F |
| Sync with Google Drive | Alt+R |
| Toggle theme | Alt+T |
| Focus navigation sidebar | Alt+M |
| Focus main content area | Alt+C |
| Open Daily Briefing | Alt+B |
| Toggle Focus Mode | Alt+W |

---

## 17. Screen Reader Quick-Start

This section is written for users who rely on screen readers and want to get up and running quickly. It covers the most common workflows for each screen reader.

### JAWS Quick-Start (Windows)

**Understanding the layout:**
The app has two main regions. The sidebar is a `navigation` landmark. The main content area is a `document` region. JAWS uses virtual cursor in the document region, which means standard reading keys work without switching modes.

**Getting started:**
1. Launch VantagePM.
2. Press **Tab** once or twice to reach the skip links. Press **Enter** on "Skip to main content" to jump past the sidebar.
3. Press **H** to move through headings in the current view.
4. Press **B** to move to buttons.
5. Press **R** to move between landmark regions (navigation, main, live region).

**Common tasks:**
- Create a task: Press **Alt+N**. The Add Task dialog opens. Fill in fields with Tab and Shift+Tab. Press **Alt+S** to save.
- Navigate sections: Press **Alt+1** through **Alt+5** for the main sections.
- Check status announcements: VantagePM uses a polite live region. JAWS reads announcements after the current speech finishes.
- Switch to virtual cursor if needed: Press **Insert+Z** to toggle. In the document region, virtual cursor should already be active.
- Read all content in a view: Press **Insert+Down Arrow** for Say All.
- Read the current line: Press **Insert+Up Arrow**.

**Modals:**
When a modal opens, focus moves into it automatically and is trapped there. Read the modal using virtual cursor keys. Press **Escape** to close and return focus to the element that opened the modal.

**Tables:**
Press **T** to jump to a table. Inside a table, use **Tab** and **arrow keys** to move between cells. Column headers are read as you navigate.

### NVDA Quick-Start (Windows)

**Understanding the layout:**
The main content area is a `document` region. NVDA's browse mode is active there automatically, so standard browse mode keys work. The NVDA key in this guide is whichever key you have set as your NVDA modifier (usually Insert or Caps Lock).

**Getting started:**
1. Launch VantagePM.
2. Press **Tab** to reach the skip links. Press **Enter** on "Skip to main content."
3. Press **H** to move by headings, **Shift+H** to go back.
4. Press **B** to move by buttons.
5. Press **D** to move by landmark regions.

**Common tasks:**
- Create a task: Press **Alt+N**. The dialog opens and focus moves in. Use Tab/Shift+Tab to move between fields. Press **Alt+S** to save.
- Navigate sections: **Alt+1** through **Alt+5**.
- Switch to Focus mode for interactive controls: Press **NVDA+Space** if browse mode prevents interaction. Press it again to return to browse mode.
- Read all: **NVDA+Down Arrow**.
- Read current line: **NVDA+Up Arrow**.

**Modals:**
Focus moves into modals automatically. Use browse mode keys to read, then press **Escape** to close.

**Tables:**
Press **T** to jump to a table. Arrow keys move between cells. NVDA reads column and row headers as you navigate.

**Announcements:**
NVDA reads the polite live region announcements automatically after current speech. If you miss an announcement, check the NVDA Speech Viewer (Tools > Speech Viewer) to see recent output.

### VoiceOver Quick-Start (macOS)

**Understanding the layout:**
The sidebar is a navigation landmark. The main content area is a document region. Use VoiceOver's landmark and heading navigation to move around efficiently.

The VO key is **Control+Option**. This guide abbreviates it as VO.

**Getting started:**
1. Launch VantagePM.
2. Press **Tab** to reach the skip links. Press **VO+Space** on "Skip to main content."
3. Press **VO+Command+H** to move to the next heading.
4. Press **VO+Command+J** to move to the next form control.
5. Press **VO+Command+L** to move to the next landmark.

**Common tasks:**
- Create a task: Press **Alt+N**. The dialog opens. Use **Tab** to move between fields. Press **Alt+S** to save.
- Navigate sections: **Alt+1** through **Alt+5** work with VoiceOver active.
- Read all: **VO+A**.
- Next item: **VO+Right Arrow**.
- Activate an item: **VO+Space** or **VO+Return**.
- Enter a group or region: **VO+Shift+Down Arrow**. Exit with **VO+Shift+Up Arrow**.

**Calendar:**
The calendar uses `role="application"`. Press **VO+Shift+Down Arrow** to enter the calendar region. Navigate days with arrow keys. Press **Enter** to activate a day. Press **VO+Shift+Up Arrow** to exit the calendar region.

**Modals:**
VoiceOver announces modals automatically when they open. Focus is trapped inside. Read using **VO+Right Arrow** or **VO+A** for read-all. Press **Escape** to close.

**Announcements:**
VoiceOver reads polite live region announcements. They are spoken after the current speech completes.

---

## 18. Accessibility Features Summary

The following accessibility features are built into VantagePM. This is a quick-reference list for users and evaluators.

### Keyboard Access
- All interactive elements are reachable by keyboard alone.
- Logical tab order throughout all views.
- Keyboard shortcuts for all major actions.
- All shortcuts are customizable via Settings > Shortcuts.

### Screen Reader Support
- All dynamic updates announced via `aria-live="polite"` live region.
- Modal dialogs use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Destructive action dialogs use `role="alertdialog"`.
- Focus trapped inside open modals using `trapFocus()`.
- Focus returns to trigger element when any modal closes.
- Main content area uses `role="document"` for JAWS and NVDA virtual/browse cursor compatibility.
- Sidebar uses `role="navigation"` landmark.
- Calendar uses `role="application"` with arrow key instructions.
- All form inputs have associated labels.
- Required fields marked with `aria-required="true"` and visible error messages using `role="alert"`.
- Sort controls use `aria-sort` (ascending, descending, or none).
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.

### Visual Accessibility
- Four themes: Light, Dark, System (follows OS), High Contrast.
- Adjustable font size via slider in Settings > Appearance.
- Reduce Motion option in Settings > Accessibility.
- Color labels on tasks are never the only means of conveying information.
- Skip links visible on keyboard focus.

### Icon and Emoji Handling
- All decorative icons and emoji use `aria-hidden="true"` so screen readers skip them.
- Navigation icons have `aria-hidden="true"` to prevent redundant announcements.

### Focus Management
- Focus moves into modals when they open.
- Focus returns to the trigger when modals close.
- Skip links allow bypassing repetitive navigation.

---

## 19. Troubleshooting

### The app is not announcing changes to my screen reader

Make sure your screen reader is running before you launch VantagePM. If changes are still not announced:

- JAWS: Try pressing **Insert+Escape** to refresh the virtual buffer, then interact with the app again.
- NVDA: Try pressing **NVDA+F5** to refresh the virtual buffer. If using NVDA with the object navigation feature, switch to browse mode with **NVDA+Space** to hear live region announcements.
- VoiceOver: If speech seems stopped, press the **Control** key once to resume it, or move focus to any element on the page to prompt VoiceOver to begin speaking again.

### Keyboard shortcuts are not working

Alt key shortcuts may conflict with system keyboard shortcuts or your screen reader's keyboard scheme. You can remap any shortcut in Settings > Shortcuts. Press **Alt+Comma** to open Settings directly, then navigate to the Shortcuts tab.

If **Alt+Comma** is also conflicted, use the sidebar navigation button for Settings and navigate there manually.

### Focus is not returning to the right place after closing a modal

This is a known issue with some screen reader configurations. If it occurs, press **Alt+C** to move focus to the main content area, then navigate from there.

### Google Drive sync is failing

Check the following:

1. You are signed in (Settings > Drive shows your account name).
2. A folder is selected (Settings > Drive shows a folder path).
3. Your internet connection is active.
4. Your Google session has not expired. Sign out and sign in again if needed.

If sync continues to fail, check whether your Google account has storage quota available. The `accesspm-data.json` file is small, but a full Drive will reject writes.

### The WCAG Audit tab is not visible

You are in Project Management mode. App mode is selected during the initial onboarding wizard and cannot be changed from within the Settings screen.

To switch modes, contact Aaron Linson for support. Include the version number from Settings > About in your message.

### A theme or font size change is not being saved

Remember that most Settings changes are pending until you activate the "Save" button. The Save/Cancel bar appears at the bottom of the settings panel when there are unsaved changes. Navigate to it and activate "Save."

### The app shows a previous version number

If you installed an update but the app still shows an older version, try the following:

1. Close VantagePM completely.
2. Run the new installer again.
3. Launch VantagePM from the Start menu (not from a previously pinned shortcut that may point to an old location).

### Getting Help

If you find a bug or accessibility issue, please open a GitHub issue. This is the fastest way to get a response and lets other users see known issues.

**How to open a GitHub issue:**

1. Go to **github.com/blindgeek1989/Vantage-PM/issues** in your browser.
2. Select "New issue."
3. Give the issue a short, descriptive title (for example, "NVDA does not announce task status change").
4. In the body, include:
   - The VantagePM version number (found in Settings > About)
   - Your operating system and version
   - Your screen reader name and version, if applicable
   - A description of what you expected to happen and what happened instead
5. Select "Submit new issue."

You do not need a GitHub account to view existing issues. To submit a new issue, a free GitHub account is required.

You can also use the in-app "Report an Issue" dialog, available from the Help menu or Settings > About. Note that in-app submissions go to the same public GitHub repository — do not include personal information such as your name, email address, or client details.

---

*VantagePM v9.7.1 -- Aaron Linson*
