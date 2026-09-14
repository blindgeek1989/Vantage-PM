# VantagePM

**WCAG 2.2 Level AA Targeted · Built by Aaron Linson**

An accessible project management desktop app for digital accessibility professionals and the teams that work with them. Runs on Windows and macOS. Designed from the ground up to work with JAWS, NVDA, and VoiceOver.

---

## User Guide

[Full user documentation](docs/user-guide.md) — covers installation, all features, keyboard shortcuts, and a dedicated screen reader quick-start for JAWS, NVDA, and VoiceOver.

---

## Features

- Task management with filtering, sorting, bulk actions, and recurring tasks
- Built-in WCAG 2.2 audit tool (78 criteria, Levels A and AA)
- Project health dashboard, milestones, and calendar view
- Task timer with 15-minute billing rounding and time logging
- Google Drive sync for team collaboration
- Team management with workload tracking and role-based views
- Full keyboard navigation with customizable shortcuts
- Light, dark, system, and high-contrast themes
- Adjustable font size and reduce-motion support
- Two modes: Digital Accessibility (full feature set) and Project Management (WCAG audit hidden)

---

## Installation

Download the latest installer from the [Releases](../../releases) page and run it.

**Important:** Always run the installer before testing. Do not test from the unpacked `dist` folder — behavior may differ.

### Prerequisites (development only)

- Node.js 18 or newer
- npm (comes with Node.js)

```bash
npm install       # install dependencies
npm start         # run in development mode
npm run build:win # build Windows installer
```

---

## Google Drive Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. Enable the **Google Drive API** under APIs and Services > Library.
3. Create OAuth 2.0 credentials — choose **Desktop app** type.
4. Add `http://localhost:42813/oauth2callback` as an authorized redirect URI.
5. Set environment variables before running:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_CLIENT_ID="your_client_id_here"
$env:GOOGLE_CLIENT_SECRET="your_client_secret_here"
npm start
```

**macOS / Linux:**
```bash
export GOOGLE_CLIENT_ID="your_client_id_here"
export GOOGLE_CLIENT_SECRET="your_client_secret_here"
npm start
```

---

## Default Keyboard Shortcuts

All shortcuts are customizable in Settings > Shortcuts.

| Action | Shortcut |
|--------|----------|
| New Task | Alt+N |
| Go to Dashboard | Alt+1 |
| Go to Tasks | Alt+2 |
| Go to Calendar | Alt+3 |
| Go to Team | Alt+4 |
| Go to Reports | Alt+5 |
| Open Settings | Alt+Comma |
| Save Item | Alt+S |
| Close Modal | Escape |
| Search Tasks | Alt+F |
| Sync with Drive | Alt+R |
| Toggle Theme | Alt+T |
| Focus Navigation | Alt+M |
| Focus Main Content | Alt+C |
| Daily Briefing | Alt+B |
| Focus Mode | Alt+W |

---

## Screen Reader Notes

### JAWS (Windows)
- The main content area uses `role="document"` so virtual cursor navigation works without mode switching
- All dialogs use `role="dialog"` or `role="alertdialog"` with `aria-modal="true"`
- Live regions use `aria-live="polite"` for status updates
- Avoid mapping shortcuts to Insert+ combinations reserved by JAWS

### NVDA (Windows)
- Browse mode is active in the main content area by default
- Tables use `scope="col"` headers and `aria-sort` on sort buttons
- Press `NVDA+Space` to switch between Browse and Focus mode when needed
- Announcements appear in the NVDA Speech Viewer (Tools > Speech Viewer)

### VoiceOver (macOS)
- Landmarks: `role="navigation"`, `role="document"`, `role="application"` (calendar)
- Enter the calendar region with `VO+Shift+Down Arrow`, exit with `VO+Shift+Up Arrow`
- All status announcements use `aria-live="polite"`

---

## Project Structure

```
accesspm/
├── src/
│   ├── main.js           # Electron main process (window, IPC, Google auth, Drive)
│   ├── preload.js        # contextBridge IPC whitelist
│   └── renderer/
│       ├── index.html    # App shell: HTML structure and CSS
│       └── renderer.js   # All app JavaScript
├── assets/               # App icons (icon.ico, icon.icns, icon.png)
├── docs/
│   └── user-guide.md     # Full user documentation
├── audit.py              # Pre-build audit script
└── package.json          # Dependencies and electron-builder config
```

---

## Reporting Issues

Open an issue at [github.com/blindgeek1989/Vantage-PM/issues](https://github.com/blindgeek1989/Vantage-PM/issues).

---

## License

UNLICENSED · Aaron Linson · 2026
