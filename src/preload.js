const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getClientId: () => ipcRenderer.invoke('get-client-id'),
  setClientId: (id) => ipcRenderer.invoke('set-client-id', id)
});