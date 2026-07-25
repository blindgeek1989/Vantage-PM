/**
 * ARIA/Accessibility role tests for VantagePM
 * Run: node tests/aria-roles.test.js
 * Requires: npm install --save-dev jsdom
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Graceful exit if jsdom is not installed
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.error('MISSING DEPENDENCY: jsdom is not installed.');
  console.error('Fix: npm install --save-dev jsdom');
  console.error('Then re-run: node tests/aria-roles.test.js');
  process.exit(1);
}

const htmlPath = path.join(__dirname, '..', 'src', 'renderer', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
const { document } = new JSDOM(html).window;

let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    console.log(`PASS: ${name}`);
    passed++;
  } else {
    console.log(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. #app must NOT have role="application"
// ---------------------------------------------------------------------------
const app = document.getElementById('app');
ok(
  '#app does not have role="application"',
  app && app.getAttribute('role') !== 'application',
  app ? `#app has role="${app.getAttribute('role')}"` : '#app not found'
);

ok(
  '#app does not have role="document"',
  app && app.getAttribute('role') !== 'document',
  app ? `#app has role="${app.getAttribute('role')}"` : '#app not found'
);

// ---------------------------------------------------------------------------
// 2. Landmark structure
// ---------------------------------------------------------------------------
const sidebar = document.getElementById('sidebar');
ok(
  'Sidebar uses a landmark element (<aside> or role="navigation")',
  sidebar && (sidebar.tagName.toLowerCase() === 'aside' || sidebar.getAttribute('role') === 'navigation'),
  sidebar ? `sidebar tagName="${sidebar.tagName}"` : '#sidebar not found'
);

const mainNav = document.getElementById('main-nav');
ok(
  '#main-nav is a <nav> or has role="navigation"',
  mainNav && (mainNav.tagName.toLowerCase() === 'nav' || mainNav.getAttribute('role') === 'navigation'),
  mainNav ? `#main-nav tagName="${mainNav.tagName}"` : '#main-nav not found'
);

const mainDiv = document.getElementById('main');
ok(
  '#main has role="main"',
  mainDiv && mainDiv.getAttribute('role') === 'main',
  mainDiv ? `role="${mainDiv.getAttribute('role')}"` : '#main not found'
);

const topbar = document.getElementById('topbar');
ok(
  '#topbar is <header> or has role="banner"',
  topbar && (topbar.tagName.toLowerCase() === 'header' || topbar.getAttribute('role') === 'banner'),
  topbar ? `tagName="${topbar.tagName}", role="${topbar.getAttribute('role')}"` : '#topbar not found'
);

// ---------------------------------------------------------------------------
// 3. Live regions
// ---------------------------------------------------------------------------
const live = document.getElementById('live');
ok(
  '#live has role="status"',
  live && live.getAttribute('role') === 'status',
  live ? `role="${live.getAttribute('role')}"` : '#live not found'
);
ok(
  '#live has aria-live="polite"',
  live && live.getAttribute('aria-live') === 'polite',
  live ? `aria-live="${live.getAttribute('aria-live')}"` : '#live not found'
);

const toast = document.getElementById('toast');
ok(
  '#toast has role="alert"',
  toast && toast.getAttribute('role') === 'alert',
  toast ? `role="${toast.getAttribute('role')}"` : '#toast not found'
);
ok(
  '#toast has aria-live="assertive"',
  toast && toast.getAttribute('aria-live') === 'assertive',
  toast ? `aria-live="${toast.getAttribute('aria-live')}"` : '#toast not found'
);

// ---------------------------------------------------------------------------
// 4. Dialogs: role="dialog" must have aria-modal and aria-labelledby
// ---------------------------------------------------------------------------
const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
ok(
  'At least one role="dialog" element exists',
  dialogs.length > 0,
  `found ${dialogs.length}`
);

const dialogsMissingModal = dialogs.filter(d => d.getAttribute('aria-modal') !== 'true');
ok(
  'All role="dialog" elements have aria-modal="true"',
  dialogsMissingModal.length === 0,
  dialogsMissingModal.map(d => d.id || '(no id)').join(', ')
);

const dialogsMissingLabel = dialogs.filter(d => !d.getAttribute('aria-labelledby'));
ok(
  'All role="dialog" elements have aria-labelledby',
  dialogsMissingLabel.length === 0,
  dialogsMissingLabel.map(d => d.id || '(no id)').join(', ')
);

// ---------------------------------------------------------------------------
// 5. Alert dialogs: must also have aria-describedby
// ---------------------------------------------------------------------------
const alertDialogs = Array.from(document.querySelectorAll('[role="alertdialog"]'));
ok(
  'At least one role="alertdialog" element exists',
  alertDialogs.length > 0,
  `found ${alertDialogs.length}`
);

const alertMissingModal = alertDialogs.filter(d => d.getAttribute('aria-modal') !== 'true');
ok(
  'All role="alertdialog" elements have aria-modal="true"',
  alertMissingModal.length === 0,
  alertMissingModal.map(d => d.id || '(no id)').join(', ')
);

const alertMissingLabel = alertDialogs.filter(d => !d.getAttribute('aria-labelledby'));
ok(
  'All role="alertdialog" elements have aria-labelledby',
  alertMissingLabel.length === 0,
  alertMissingLabel.map(d => d.id || '(no id)').join(', ')
);

const alertMissingDesc = alertDialogs.filter(d => !d.getAttribute('aria-describedby'));
ok(
  'All role="alertdialog" elements have aria-describedby',
  alertMissingDesc.length === 0,
  alertMissingDesc.map(d => d.id || '(no id)').join(', ')
);

// ---------------------------------------------------------------------------
// 6. Labels: every visible <input> must have an associated <label>
//    (excludes inputs with aria-hidden="true" or tabindex="-1" with aria-hidden)
// ---------------------------------------------------------------------------
const allInputs = Array.from(document.querySelectorAll('input[id]'))
  .filter(i => i.getAttribute('aria-hidden') !== 'true');

const inputsMissingLabel = allInputs.filter(input => {
  const id = input.id;
  const labelEl = document.querySelector(`label[for="${id}"]`);
  // Also accept aria-label or aria-labelledby on the input itself
  const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
  return !labelEl && !hasAriaLabel;
});

ok(
  'All visible inputs have an associated label',
  inputsMissingLabel.length === 0,
  inputsMissingLabel.map(i => `#${i.id}`).join(', ')
);

// ---------------------------------------------------------------------------
// 7. No role="grid" without proper structure
// ---------------------------------------------------------------------------
const grids = Array.from(document.querySelectorAll('[role="grid"]'));
ok(
  'No bare role="grid" elements in static HTML',
  grids.length === 0,
  `Found ${grids.length} role="grid" element(s) — grid requires role="row" children`
);

// ---------------------------------------------------------------------------
// 8. Nav buttons in #main-nav must be <button> elements
// ---------------------------------------------------------------------------
if (mainNav) {
  const navLinks = Array.from(mainNav.querySelectorAll('a:not([href])'));
  ok(
    '#main-nav contains no <a> elements without href',
    navLinks.length === 0,
    `Found ${navLinks.length} bare <a> elements in nav`
  );

  const navBtns = Array.from(mainNav.querySelectorAll('li button'));
  ok(
    '#main-nav list items use <button> elements',
    navBtns.length > 0,
    `Found ${navBtns.length} nav buttons`
  );
} else {
  ok('#main-nav present for nav button checks', false, '#main-nav not found');
  ok('#main-nav list items use <button> elements', false, '#main-nav not found');
}

// ---------------------------------------------------------------------------
// 9. Every modal overlay has at least one focusable element
// ---------------------------------------------------------------------------
const overlays = Array.from(document.querySelectorAll('.overlay[role="dialog"], .overlay[role="alertdialog"]'));
const overlaysMissingFocusable = overlays.filter(o => {
  const focusable = o.querySelector('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])');
  return !focusable;
});
ok(
  'Every modal overlay has at least one focusable element',
  overlaysMissingFocusable.length === 0,
  overlaysMissingFocusable.map(o => o.id || '(no id)').join(', ')
);

// ---------------------------------------------------------------------------
// 10. aria-haspopup must use "dialog" or "menu", not "true"
// ---------------------------------------------------------------------------
const haspopupTrue = Array.from(document.querySelectorAll('[aria-haspopup="true"]'));
ok(
  'No aria-haspopup="true" — must use "dialog" or "menu"',
  haspopupTrue.length === 0,
  haspopupTrue.map(el => el.id || el.getAttribute('aria-label') || el.tagName).join(', ')
);

// ---------------------------------------------------------------------------
// 11. labelledby targets must exist in the DOM
// ---------------------------------------------------------------------------
const allLabelledBy = Array.from(document.querySelectorAll('[aria-labelledby]'));
const brokenLabelledBy = allLabelledBy.filter(el => {
  const ids = el.getAttribute('aria-labelledby').split(/\s+/);
  return ids.some(id => !document.getElementById(id));
});
ok(
  'All aria-labelledby ids resolve to existing elements',
  brokenLabelledBy.length === 0,
  brokenLabelledBy.map(el => `${el.id || el.tagName} → "${el.getAttribute('aria-labelledby')}"`).join('; ')
);

// ---------------------------------------------------------------------------
// 12. aria-describedby targets must exist in the DOM
// ---------------------------------------------------------------------------
const allDescribedBy = Array.from(document.querySelectorAll('[aria-describedby]'));
const brokenDescribedBy = allDescribedBy.filter(el => {
  const ids = el.getAttribute('aria-describedby').split(/\s+/);
  return ids.some(id => !document.getElementById(id));
});
ok(
  'All aria-describedby ids resolve to existing elements',
  brokenDescribedBy.length === 0,
  brokenDescribedBy.map(el => `${el.id || el.tagName} → "${el.getAttribute('aria-describedby')}"`).join('; ')
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const total = passed + failed;
console.log(`\n${passed}/${total} tests passed${failed > 0 ? ` (${failed} FAILED)` : ''}`);
process.exit(failed > 0 ? 1 : 0);
