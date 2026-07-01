/**
 * VantagePM v3.0 — main.js
 */
'use strict';

const { app, BrowserWindow, ipcMain, shell, Menu, nativeTheme, Notification } = require('electron');
const path = require('path');
const fs   = require('fs');
const http = require('http');
const url  = require('url');

let autoUpdater;
try { autoUpdater = require('electron-updater').autoUpdater; } catch(e) { autoUpdater = null; }

let Store;
try { Store = require('electron-store'); } catch(e) { Store = null; }

const DEFAULT_SHORTCUTS = {
  newTask:'Alt+N', goToDashboard:'Alt+1', goToTasks:'Alt+2', goToCalendar:'Alt+3',
  goToTeam:'Alt+4', goToReports:'Alt+5', goToSettings:'Alt+Comma',
  saveItem:'Alt+S', closeModal:'Escape', searchTasks:'Alt+F',
  syncDrive:'Alt+R', toggleTheme:'Alt+T', focusNav:'Alt+M', focusMain:'Alt+C',
  dailyBriefing:'Alt+B', focusMode:'Alt+W',
};

const store = Store ? new Store({
  defaults: {
    theme:'system', language:'en', fontSize:16, reduceMotion:false, highContrast:false,
    driveFolderId:'', driveFolderName:'', syncInterval:5,
    googleTokens:null, googleEmail:null, shortcuts:DEFAULT_SHORTCUTS,
    notifications:true, autoSync:true, confirmOnDelete:true, dateFormat:'MM/DD/YYYY', hasSeenOnboarding:false,
    reminderLeadDays:1, currentUser:'',
  }
}) : { _d:{}, get(k){return this._d[k];}, set(k,v){this._d[k]=v;}, delete(k){delete this._d[k];} };

let oauth2Client = null;
function initOAuth() {
  try {
    const { google } = require('googleapis');
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID     || 'YOUR_CLIENT_ID',
      process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
      'http://localhost:42813/oauth2callback'
    );
    const saved = store.get('googleTokens');
    if (saved) oauth2Client.setCredentials(saved);
  } catch(e) { console.warn('googleapis unavailable:', e.message); }
}

let win = null;
let reminderTimer = null;

function createWindow() {
  initOAuth();
  win = new BrowserWindow({
    width:1280, height:820, minWidth:800, minHeight:600,
    title:'VantagePM',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0D1117' : '#F4F6FB',
    show:false,
    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation:true, nodeIntegration:false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => {
    win.show();
    win.webContents.send('init-settings', getSettings());
    win.webContents.send('system-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    if (autoUpdater) setTimeout(() => checkForUpdates(), 3000);
  });
  nativeTheme.on('updated', () => {
    if (win) win.webContents.send('system-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });
  buildMenu();
  startReminderScheduler();
}

function checkForUpdates() {
  if (!autoUpdater) return;
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available',  () => { if (win) win.webContents.send('update-available'); });
  autoUpdater.on('update-downloaded', () => { if (win) win.webContents.send('update-downloaded'); });
}

ipcMain.handle('install-update', () => { if (autoUpdater) autoUpdater.quitAndInstall(); });

function startReminderScheduler() {
  reminderTimer = setInterval(() => checkReminders(), 60 * 60 * 1000);
  setTimeout(() => checkReminders(), 5000);
}
function checkReminders() {
  if (!store.get('notifications')) return;
  if (win) win.webContents.send('check-reminders');
}
ipcMain.on('send-reminder', (e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show();
});

function buildMenu() {
  const sc  = store.get('shortcuts') || DEFAULT_SHORTCUTS;
  const isMac = process.platform === 'darwin';
  const send  = (ch, d) => win && win.webContents.send(ch, d);
  const template = [
    ...(isMac ? [{ label:app.name, submenu:[{role:'about'},{type:'separator'},{role:'services'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}] }] : []),
    { label:'&File', submenu:[
      {label:'New Task',         accelerator:sc.newTask,       click:()=>send('nav','newTask')},
      {label:'Daily Briefing',   accelerator:sc.dailyBriefing, click:()=>send('nav','dailyBriefing')},
      {label:'Focus Mode',       accelerator:sc.focusMode,     click:()=>send('nav','focusMode')},
      {label:'Sync with Drive',  accelerator:sc.syncDrive,     click:()=>send('nav','syncDrive')},
      {type:'separator'},
      {label:'Export to CSV',    click:()=>send('nav','exportCSV')},
      {type:'separator'},
      {label:'Settings',         accelerator:sc.goToSettings,  click:()=>send('nav','goToSettings')},
      {type:'separator'},
      isMac ? {role:'close'} : {role:'quit'},
    ]},
    { label:'&View', submenu:[
      {label:'Dashboard',  accelerator:sc.goToDashboard, click:()=>send('nav','goToDashboard')},
      {label:'Tasks',      accelerator:sc.goToTasks,     click:()=>send('nav','goToTasks')},
      {label:'Calendar',   accelerator:sc.goToCalendar,  click:()=>send('nav','goToCalendar')},
      {label:'Team',       accelerator:sc.goToTeam,      click:()=>send('nav','goToTeam')},
      {label:'Reports',    accelerator:sc.goToReports,   click:()=>send('nav','goToReports')},
      {type:'separator'},
      {label:'Toggle Theme', accelerator:sc.toggleTheme, click:()=>send('nav','toggleTheme')},
      {type:'separator'},
      {role:'reload'},{role:'forceReload'},{role:'toggleDevTools'},
      {type:'separator'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},
      {type:'separator'},{role:'togglefullscreen'},
    ]},
    { label:'&Navigate', submenu:[
      {label:'Focus Navigation',    accelerator:sc.focusNav,    click:()=>send('nav','focusNav')},
      {label:'Focus Main Content',  accelerator:sc.focusMain,   click:()=>send('nav','focusMain')},
      {label:'Search Tasks',        accelerator:sc.searchTasks, click:()=>send('nav','searchTasks')},
    ]},
    { label:'&Help', submenu:[
      {label:'Keyboard Shortcuts',         click:()=>send('nav','showShortcuts')},
      {label:'Check for Updates',          click:()=>checkForUpdates()},
      {label:'WCAG 2.2 Quick Reference',   click:()=>shell.openExternal('https://www.w3.org/WAI/WCAG22/quickref/')},
      {type:'separator'},
      {label:'About VantagePM', click:()=>send('show-about',null)},
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getSettings() {
  return {
    theme:           store.get('theme')            || 'system',
    language:        store.get('language')         || 'en',
    fontSize:        store.get('fontSize')         || 16,
    reduceMotion:    store.get('reduceMotion')     || false,
    highContrast:    store.get('highContrast')     || false,
    driveFolderId:   store.get('driveFolderId')    || '',
    driveFolderName: store.get('driveFolderName')  || '',
    syncInterval:    store.get('syncInterval')     || 5,
    shortcuts:       store.get('shortcuts')        || DEFAULT_SHORTCUTS,
    notifications:   store.get('notifications')    !== false,
    autoSync:        store.get('autoSync')         !== false,
    confirmOnDelete: store.get('confirmOnDelete')  !== false,
    dateFormat:      store.get('dateFormat')       || 'MM/DD/YYYY',
    reminderLeadDays:store.get('reminderLeadDays') || 1,
    currentUser:     store.get('currentUser')      || '',
    googleConnected: !!(oauth2Client && store.get('googleTokens')),
    googleEmail:     store.get('googleEmail')      || null,
    platform:        process.platform,
    defaultShortcuts: DEFAULT_SHORTCUTS,
    appVersion:      app.getVersion(),
    hasSeenOnboarding: store.get('hasSeenOnboarding') || false,
  };
}

ipcMain.handle('get-settings',    ()         => getSettings());
ipcMain.handle('save-settings',   (e,updates)=> { Object.entries(updates).forEach(([k,v])=>store.set(k,v)); buildMenu(); return getSettings(); });
ipcMain.handle('reset-shortcuts', ()         => { store.set('shortcuts',DEFAULT_SHORTCUTS); buildMenu(); return DEFAULT_SHORTCUTS; });

// Google auth
ipcMain.handle('google-sign-in', () => new Promise((resolve) => {
  if (!oauth2Client) return resolve({ error:'Run: npm install googleapis' });
  const authUrl = oauth2Client.generateAuthUrl({
    access_type:'offline', prompt:'consent',
    scope:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'],
  });
  let server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname !== '/oauth2callback') return;
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#0D1117;color:#E6EAF8"><h1 style="color:#5B8DEF">VantagePM — Sign-in complete!</h1><p>You can close this tab and return to VantagePM.</p></body></html>`);
    server.close();
    try {
      const { tokens } = await oauth2Client.getToken(parsed.query.code);
      oauth2Client.setCredentials(tokens);
      store.set('googleTokens', tokens);
      const { google } = require('googleapis');
      const info = await google.oauth2({version:'v2',auth:oauth2Client}).userinfo.get();
      store.set('googleEmail', info.data.email);
      resolve({ success:true, email:info.data.email });
    } catch(err) { resolve({ error:err.message }); }
  });
  server.listen(42813);
  server.on('error', e => resolve({ error:e.message }));
  shell.openExternal(authUrl);
}));

ipcMain.handle('google-sign-out', async () => {
  try { if (oauth2Client) await oauth2Client.revokeCredentials(); } catch(_) {}
  store.delete('googleTokens'); store.delete('googleEmail');
  return { success:true };
});

// Drive
ipcMain.handle('drive-list-folders', async () => {
  if (!oauth2Client || !store.get('googleTokens')) return { error:'Not signed in.' };
  try {
    const { google } = require('googleapis');
    const drive = google.drive({version:'v3',auth:oauth2Client});
    const res = await drive.files.list({ q:"mimeType='application/vnd.google-apps.folder' and trashed=false", fields:'files(id,name)', pageSize:200, orderBy:'name' });
    return { folders:res.data.files };
  } catch(e) { return { error:e.message }; }
});

ipcMain.handle('drive-read', async () => {
  const folderId = store.get('driveFolderId');
  if (!folderId || !oauth2Client || !store.get('googleTokens')) return { data:null };
  try {
    const { google } = require('googleapis');
    const drive = google.drive({version:'v3',auth:oauth2Client});
    const search = await drive.files.list({ q:`name='accesspm-data.json' and '${folderId}' in parents and trashed=false`, fields:'files(id)' });
    if (!search.data.files.length) return { data:null };
    const res = await drive.files.get({ fileId:search.data.files[0].id, alt:'media' });
    return { data:res.data };
  } catch(e) { return { error:e.message }; }
});

ipcMain.handle('drive-write', async (e, payload) => {
  const folderId = store.get('driveFolderId');
  if (!folderId || !oauth2Client || !store.get('googleTokens')) return { error:'Not configured.' };
  try {
    const { google } = require('googleapis');
    const { Readable } = require('stream');
    const drive = google.drive({version:'v3',auth:oauth2Client});
    const body = Readable.from([JSON.stringify(payload,null,2)]);
    const search = await drive.files.list({ q:`name='accesspm-data.json' and '${folderId}' in parents and trashed=false`, fields:'files(id)' });
    if (search.data.files.length) {
      await drive.files.update({ fileId:search.data.files[0].id, media:{mimeType:'application/json',body} });
    } else {
      await drive.files.create({ requestBody:{name:'accesspm-data.json',parents:[folderId]}, media:{mimeType:'application/json',body}, fields:'id' });
    }
    return { success:true, timestamp:new Date().toISOString() };
  } catch(e) { return { error:e.message }; }
});

ipcMain.handle('local-load', async () => {
  const filePath = path.join(app.getPath('userData'), 'vantagepm-data.json');
  try {
    if (!fs.existsSync(filePath)) return { data: null };
    return { data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch(e) { return { data: null }; }
});
ipcMain.handle('local-save', async (e, payload) => {
  const filePath = path.join(app.getPath('userData'), 'vantagepm-data.json');
  try { fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8'); return { success: true }; }
  catch(e) { return { error: e.message }; }
});

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length===0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform!=='darwin') app.quit(); });
app.on('will-quit', () => { if (reminderTimer) clearInterval(reminderTimer); });
