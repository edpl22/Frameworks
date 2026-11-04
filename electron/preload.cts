import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

// Minimal, typed surface exposed to the renderer. contextIsolation stays on;
// the renderer never gets direct access to Node or ipcRenderer.
contextBridge.exposeInMainWorld('fwDesktop', {
  isDesktop: true,
  platform: process.platform,
  saveFile: (opts: unknown) => ipcRenderer.invoke('fw:save-file', opts),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fw:write-file', path, content),
  openProject: () => ipcRenderer.invoke('fw:open-project'),
  setTitle: (title: string) => ipcRenderer.send('fw:set-title', title),
  openExternal: (url: string) => ipcRenderer.send('fw:open-external', url),
  onMenu: (cb: (action: string) => void) => {
    const handler = (_e: IpcRendererEvent, action: string) => cb(action);
    ipcRenderer.on('fw:menu', handler);
    return () => ipcRenderer.removeListener('fw:menu', handler);
  },
});
