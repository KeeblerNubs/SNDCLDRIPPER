const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getClientId: () => ipcRenderer.invoke('get-client-id'),
  setClientId: (id) => ipcRenderer.invoke('set-client-id', id),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  ripPlaylist: (payload) => ipcRenderer.invoke('rip-playlist', payload)
});
