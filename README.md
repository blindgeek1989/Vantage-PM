# AccessPM — Accessible Project Management Desktop App

**WCAG 2.2 Level AA Targeted · Built for the Blind Institute of Technology**

---

## Overview

AccessPM is a cross-platform Electron desktop application for accessible project management.
Designed to work seamlessly with **JAWS**, **NVDA**, and **VoiceOver**.

---

## Prerequisites

- **Node.js** 18 or newer: https://nodejs.org
- **npm** (comes with Node.js)

---

## Installation

```bash
# 1. Clone or unzip the project
cd accesspm

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start
```

---

## Building an Installer

```bash
# Windows (.exe NSIS installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (AppImage, .deb, .rpm)
npm run build:linux

# All platforms
npm run build:all
```

Installers are output to the `dist/` folder.

---

## Google Drive Setup

### Step 1 — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "AccessPM")
3. Enable the **Google Drive API** under APIs & Services → Library

### Step 2 — Create OAuth 2.0 Credentials

1. Go to APIs & Services → Credentials
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Desktop app**
4. Name it "AccessPM Desktop"
5. Under **Authorized redirect URIs**, add: `http://localhost:42813/oauth2callback`
6. Download the credentials JSON

### Step 3 — Set Environment Variables

**Windows (Command Prompt):**
```cmd
set GOOGLE_CLIENT_ID=your_client_id_here
set GOOGLE_CLIENT_SECRET=your_client_secret_here
npm start
```

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

**For production builds**, embed these via an `.env` file or system-level environment variables set by your IT department.

### Step 4 — Sign In and Choose a Folder

1. Launch AccessPM
2. Go to **Settings → Google Drive**
3. Click **Sign in with Google** — your browser will open
4. Sign in and approve permissions
5. Return to AccessPM and click **Choose Folder**
6. Select the folder all team members will share

> **All team members** must point to the **same Google Drive folder**.
> AccessPM stores data in a single file: `accesspm-data.json`

---

## Default Keyboard Shortcuts

| Action               | Shortcut       |
|----------------------|----------------|
| New Task             | Alt+N          |
| Go to Dashboard      | Alt+1          |
| Go to Tasks          | Alt+2          |
| Go to Calendar       | Alt+3          |
| Go to Team           | Alt+4          |
| Go to Reports        | Alt+5          |
| Open Settings        | Alt+Comma      |
| Save Item            | Alt+S          |
| Close Modal          | Escape         |
| Search Tasks         | Alt+F          |
| Sync with Drive      | Alt+R          |
| Toggle Theme         | Alt+T          |
| Focus Navigation     | Alt+M          |
| Focus Main Content   | Alt+C          |

All shortcuts are fully customizable in **Settings → Shortcuts**.

---

## Screen Reader Notes

### JAWS (Windows)
- All dialogs use `aria-modal="true"` and `role="dialog"` — JAWS will announce them correctly
- Live regions (`aria-live="polite"`) announce saves, deletes, and sync status
- The app menu is keyboard accessible via the standard Windows menu bar (Alt key)
- Avoid mapping shortcuts to Insert+ combinations which JAWS reserves

### NVDA (Windows)
- NVDA browse mode: press Escape or NVDA+Space to exit before using app shortcuts
- Tables use proper `scope="col"` headers — NVDA will read them in table navigation mode
- All sort buttons on tables expose `aria-sort` state
- Avoid mapping shortcuts to Ctrl+Alt+ combinations which NVDA uses for object navigation

### VoiceOver (macOS)
- Full QuickNav support via standard HTML semantics
- Landmarks: `role="banner"`, `role="main"`, `role="navigation"`, `role="region"` are all used
- Status announcements use `role="status"` and `aria-live="polite"`

---

## WCAG 2.2 Implementation Notes

| Criterion | Implementation |
|-----------|---------------|
| 1.3.1 Info and Relationships | Semantic HTML, ARIA roles, table headers |
| 1.4.3 Contrast (Minimum) | All text ≥4.5:1 in both light and dark modes |
| 1.4.11 Non-text Contrast | UI components ≥3:1 against adjacent colors |
| 2.1.1 Keyboard | All functionality operable by keyboard alone |
| 2.4.1 Bypass Blocks | Skip links to main content and navigation |
| 2.4.3 Focus Order | Logical DOM order; focus managed on modal open/close |
| 2.4.7 Focus Visible | 3px solid focus ring on all interactive elements |
| 2.4.11 Focus Appearance | Focus indicator meets minimum area/contrast requirements |
| 3.3.1 Error Identification | Inline error messages linked to fields via aria-describedby |
| 3.3.2 Labels or Instructions | All inputs have visible labels; required fields marked |
| 4.1.2 Name, Role, Value | All components expose accessible name, role, and state |
| 4.1.3 Status Messages | All dynamic updates announced via live regions |

---

## Project Structure

```
accesspm/
├── src/
│   ├── main.js          # Electron main process (window, IPC, Google auth, Drive)
│   ├── preload.js       # Secure contextBridge (IPC whitelist)
│   └── renderer/
│       └── index.html   # Full app UI (all views + settings)
├── assets/              # App icons (icon.ico, icon.icns, icon.png)
├── package.json         # Dependencies + electron-builder config
└── README.md            # This file
```

---

## Adding App Icons

Place your icon files in the `assets/` folder:
- `icon.ico` — Windows
- `icon.icns` — macOS  
- `icon.png` — Linux (512×512 recommended)

Free icon creation: https://www.icoconverter.com

---

## License

MIT · Blind Institute of Technology · 2026
