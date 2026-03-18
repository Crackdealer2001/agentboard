const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  isElectron: true,

  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),
})
