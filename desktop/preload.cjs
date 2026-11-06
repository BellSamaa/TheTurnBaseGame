const { contextBridge, ipcRenderer } = require('electron');
const { pathname } = new URL(location.href);

if (location.protocol === 'file:' && pathname.endsWith('/connect.html')) {
  contextBridge.exposeInMainWorld('diceManiac', {
    savedServer: () => ipcRenderer.invoke('get-server'),
    connect: value => ipcRenderer.invoke('connect-server', value),
    onUnavailable: callback => ipcRenderer.on('server-unavailable', () => callback()),
  });
}
