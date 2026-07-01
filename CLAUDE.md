# VantagePM

Electron-based accessible project management app for digital accessibility professionals.
WCAG 2.2 AA targeted. Optimized for JAWS, NVDA, and VoiceOver.

## Build Commands

```
cd "C:\a11y project\accesspm"
npm install                   # install dependencies
npm run build:win             # build Windows installer
npm run start                 # run in dev mode
```

Output installer lands in `dist\VantagePM Setup X.X.X.exe`.
After every build, run the installer before testing — do not test from the unpacked folder.

## Project Structure

```
C:\a11y project\accesspm\
├── src\
│   ├── main.js          — Electron main process, IPC, Google OAuth2, Drive sync
│   ├── preload.js       — contextBridge whitelist
│   └── renderer\
│       └── index.html   — entire app UI: HTML, CSS, and JS in one file
├── assets\              — icon.ico, icon.icns, icon.png
├── package.json         — electron-builder config, productName: VantagePM
├── audit.py             — pre-build audit script (see below)
└── CLAUDE.md            — this file
```

All app logic lives in `src/renderer/index.html`. There is no bundler or framework.

## Pre-Build Audit

Run before every build. All checks must pass before packaging.

```
cd "C:\a11y project\accesspm"
python audit.py
```

Save this as `audit.py` in the project root:

```python
import re
from collections import Counter

with open('src/renderer/index.html', encoding='utf-8') as f:
    content = f.read()

script_start = content.find('<script>')
script_end   = content.rfind('</script>')
body_close   = content.rfind('</body>')
html_close   = content.rfind('</html>')
init_idx     = content.rfind('init();')
js = content[script_start+8:script_end]

sl = lambda idx: content[:idx].count('\n') + 1
order_ok = sl(script_start) < sl(init_idx) < sl(script_end) < sl(body_close) < sl(html_close)
ob = js.count('{'); cb = js.count('}')
bt = js.count('`')
funcs = re.findall(r'function (\w+)\s*\(', js)
dupes = {k:v for k,v in Counter(funcs).items() if v > 1}
confirms = len(re.findall(r'(?<!\w)confirm\(', js))
csp_ok = "script-src 'self' 'unsafe-inline'" in content
key = ['nav','init','openAddTask','openEditTask','saveTask',
       'openModalEl','closeModal','announce']
missing = [f for f in key if f'function {f}(' not in js]

checks = {
    'Document order'  : order_ok,
    'Single script'   : content.count('<script') == 1,
    'Brace balance'   : ob == cb,
    'Backticks even'  : bt % 2 == 0,
    'No duplicates'   : not dupes,
    'No confirm()'    : confirms == 0,
    'One init() call' : content.count('init();') == 1,
    'Key functions'   : not missing,
    'CSP allows JS'   : csp_ok,
}

for name, ok in checks.items():
    print(f"{'OK' if ok else 'FAIL'} {name}")

if dupes:       print(f"   Duplicates: {dupes}")
if missing:     print(f"   Missing: {missing}")
if ob != cb:    print(f"   Braces: {ob} open / {cb} close")

all_ok = all(checks.values())
print(f"\nVERDICT: {'PASS - safe to build' if all_ok else 'FAIL - fix before building'}")
```

## Critical Code Rules

### Structure
- index.html must have exactly one script block
- The script block must open after all HTML modals and close before </body>
- init() must be called once, as the very last statement inside the script block
- Order at end of file: </script> then </body> then </html>

### JavaScript
- Zero duplicate functions — never define the same function name twice
- Zero native confirm() calls — always use the confirm-modal alertdialog
- Zero stale aliases — never leave const _foo_v6 = foo patterns in the file
- Braces must balance exactly
- All template literals must be closed — backtick count must be even
- No orphaned code, no commented-out dead functions

### Accessibility (non-negotiable)
- All decorative emoji must use: <span aria-hidden="true">emoji</span>
- Nav icons already have aria-hidden="true" on .nav-icon spans — keep it
- Every modal: role="dialog", aria-modal="true", aria-labelledby
- Destructive modals: role="alertdialog" not role="dialog"
- Every form input needs a label with matching for and id
- Required fields: aria-required="true" plus a visible error span with role="alert"
- All dynamic updates go through announce() for NVDA and JAWS
- Focus returns to trigger element when modal closes
- Modals trap focus via trapFocus()

### Settings system
- All settings changes go through setPending(key, value) — never save directly
- Save/Cancel bar appears via updateSaveBar() when settingsHasChanges is true
- Exceptions that save immediately: Drive sign-in, folder selection, custom statuses
- cancelSettings() reverts via settingsSnapshot

### Adding new features
1. Search for existing functions with the same name before writing new ones
2. Inline changes into existing functions — do not create _originalName aliases
3. If two definitions end up in the file, remove the first and keep the most complete
4. Run audit.py after every change

## Version History

| Version | Key changes |
|---------|-------------|
| v5.0.0  | Settings Save/Cancel, task templates, custom statuses, bulk actions, color labels, onboarding |
| v5.1    | Theme switching fix, onboarding copy updated to be organization-agnostic |
| v6.0.0  | Task timer with 15-min billing rounding, quick capture, natural language due dates |
| v7.0.0  | Project health dashboard, time summary, task aging alerts, workload balancing, team notes, SR conflict detector, session summary |
| v7.4    | Script block moved to before </body> — confirmed working build |
| v8.0.0  | Role-based views, priority escalation, time goals per project, end of day checklist, velocity tracking |
| v8.1    | Add Task button fixed (stale alias removed), all decorative emoji hidden from screen readers |

## Common Error Meanings

| Error in electron.txt | Cause | Fix |
|-----------------------|-------|-----|
| Unexpected token < | HTML tag inside the JS script block | Move the HTML outside </script> |
| nav is not defined | init() failed — script block broken | Check script block structure and order |
| _foo is not defined | Stale alias left in code | Remove the const _foo = foo line |
| Build produces wrong version | Old package.json still in place | Re-copy package.json from the zip |

## Google Drive Setup (one-time)

1. Go to console.cloud.google.com and create a project
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials — choose Desktop app type
4. Add http://localhost:42813 as an authorized redirect URI
5. Set environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

## Developer Notes

- Aaron uses NVDA and JAWS on Windows, VoiceOver on Mac and iOS — CPACC certified
- Project must stay at C:\a11y project\accesspm — OneDrive paths cause build failures
- Standard update process: xcopy src, copy package.json, npm run build:win, run installer
- To read build output: notepad "C:\a11y project\build.txt"
- To enable Electron logging: dist\win-unpacked\VantagePM.exe --enable-logging > electron.txt 2>&1
