import { contextBridge, ipcRenderer } from 'electron';
import type { Account, Action, Layout, Rect, Snapshot } from '../shared/model';

const api = {
  snapshot: (): Promise<Snapshot> => ipcRenderer.invoke('snapshot'),
  saveAccount: (account: Partial<Account>) => ipcRenderer.invoke('account:save', account),
  deleteAccount: (id: string, clearSession: boolean) => ipcRenderer.invoke('account:delete', id, clearSession),
  reorder: (ids: string[]) => ipcRenderer.invoke('account:reorder', ids),
  select: (id: string) => ipcRenderer.invoke('select', id),
  layout: (layout: Layout) => ipcRenderer.invoke('layout', layout),
  collapseSidebar: (collapsed: boolean) => ipcRenderer.invoke('sidebar', collapsed),
  setRects: (rects: Record<string, Rect>) => ipcRenderer.send('rects', rects),
  action: (id: string, action: Action) => ipcRenderer.invoke('action', id, action),
  suspend: (id: string) => ipcRenderer.invoke('suspend', id),
  resume: (id: string) => ipcRenderer.invoke('resume', id),
  onSnapshot: (cb: (state: Snapshot) => void) => { const listener = (_event: Electron.IpcRendererEvent, state: Snapshot) => cb(state); ipcRenderer.on('state', listener); return () => ipcRenderer.removeListener('state', listener); },
  onShortcut: (cb: (key: string) => void) => { const listener = (_event: Electron.IpcRendererEvent, key: string) => cb(key); ipcRenderer.on('shortcut', listener); return () => ipcRenderer.removeListener('shortcut', listener); }
};
contextBridge.exposeInMainWorld('workspace', api);
