'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  getSettings:       ()  => ipcRenderer.invoke('get-settings'),
  saveSettings:      (u) => ipcRenderer.invoke('save-settings', u),
  resetShortcuts:    ()  => ipcRenderer.invoke('reset-shortcuts'),
  googleSignIn:      ()  => ipcRenderer.invoke('google-sign-in'),
  googleSignOut:     ()  => ipcRenderer.invoke('google-sign-out'),
  driveListFolders:  ()  => ipcRenderer.invoke('drive-list-folders'),
  driveRead:         ()  => ipcRenderer.invoke('drive-read'),
  driveWrite:        (d) => ipcRenderer.invoke('drive-write', d),
  installUpdate:     ()  => ipcRenderer.invoke('install-update'),
  localLoad:         ()  => ipcRenderer.invoke('local-load'),
  localSave:         (d) => ipcRenderer.invoke('local-save', d),
  sendReminder:      (d) => ipcRenderer.send('send-reminder', d),
  onInitSettings:    (cb) => ipcRenderer.on('init-settings',    (_,d)=>cb(d)),
  onSystemTheme:     (cb) => ipcRenderer.on('system-theme',     (_,d)=>cb(d)),
  onNav:             (cb) => ipcRenderer.on('nav',              (_,d)=>cb(d)),
  onShowAbout:       (cb) => ipcRenderer.on('show-about',       (_,d)=>cb(d)),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_,d)=>cb(d)),
  onUpdateDownloaded:(cb) => ipcRenderer.on('update-downloaded',(_,d)=>cb(d)),
  onCheckReminders:  (cb) => ipcRenderer.on('check-reminders',  (_,d)=>cb(d)),
  platform: process.platform,
});
