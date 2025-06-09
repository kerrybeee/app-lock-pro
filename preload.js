const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  authenticateApp: (appName) => ipcRenderer.invoke('authenticate-app', appName),
});
