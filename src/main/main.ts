import { app, BrowserWindow, ipcMain, session, shell, WebContentsView, type Rectangle } from 'electron';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { isUuid, languageFromLocale, normalizeSettings, partitionFor, safeXUrl, validateAccount, visibleIds, type Account, type Action, type Language, type Layout, type Rect, type Settings, type Snapshot, type ViewStatus } from '../shared/model';

const dev = !app.isPackaged;
// X can initialize WebRTC on normal pages. Chromium's mDNS responder can open
// an inbound port and cause a Windows Firewall prompt on first launch.
// Keep the IP policy restrictive before disabling mDNS IP masking globally.
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');
let win: BrowserWindow;
let settings: Settings;
let settingsPath: string;
const views = new Map<string, WebContentsView>();
const suspended = new Set<string>();
const rects = new Map<string, Rectangle>();
const allowedActions: Action[] = ['home','notifications','profile','compose','reload','back','forward','focus'];
let saveTimer: NodeJS.Timeout | undefined;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = settingsPath + '.tmp';
    writeFileSync(tmp, JSON.stringify(settings, null, 2), 'utf8');
    renameSync(tmp, settingsPath);
  }, 150);
}
function saveNow() {
  clearTimeout(saveTimer);
  const tmp = settingsPath + '.tmp';
  writeFileSync(tmp, JSON.stringify(settings, null, 2), 'utf8');
  renameSync(tmp, settingsPath);
}
function status(id: string): ViewStatus {
  if (suspended.has(id)) return 'suspended';
  if (!views.has(id)) return 'unloaded';
  return visibleIds(settings).includes(id) ? 'visible' : 'hidden';
}
function snapshot(): Snapshot { return { settings, statuses: Object.fromEntries(settings.accounts.map(a => [a.id, status(a.id)])) }; }
function broadcast() { if (win && !win.isDestroyed()) win.webContents.send('state', snapshot()); }
function accountFor(id: unknown): Account {
  if (!isUuid(id)) throw new Error('INVALID_ID');
  const account = settings.accounts.find(a => a.id === id);
  if (!account) throw new Error('ACCOUNT_NOT_FOUND');
  return account;
}
function guard(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('INVALID_SENDER');
}
function cleanupView(id: string) {
  const view = views.get(id);
  if (!view) return;
  if (!view.webContents.isDestroyed()) {
    const url = view.webContents.getURL();
    const account = settings.accounts.find(a => a.id === id);
    if (account && safeXUrl(url)) account.lastUrl = url;
    if (!win.isDestroyed()) win.contentView.removeChildView(view);
    view.webContents.close();
  }
  views.delete(id);
  rects.delete(id);
  save();
}
function createView(account: Account): WebContentsView {
  const view = new WebContentsView({ webPreferences: { partition: partitionFor(account.id), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, javascript: true, webviewTag: false } });
  const wc = view.webContents;
  wc.setZoomFactor(account.zoom);
  // X's feed can initialize WebRTC even though this app does not use peer-to-peer features.
  // Avoid local UDP listeners that can trigger a Windows inbound firewall prompt.
  wc.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');
  const ses = wc.session;
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  wc.setWindowOpenHandler(({ url }) => {
    if (safeXUrl(url)) void wc.loadURL(url);
    else if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', (event, url) => {
    if (!safeXUrl(url)) {
      event.preventDefault();
      if (url.startsWith('https://')) void shell.openExternal(url);
    }
  });
  wc.on('did-navigate', (_event, url) => { if (safeXUrl(url)) { account.lastUrl = url; save(); } });
  wc.on('did-navigate-in-page', (_event, url) => { if (safeXUrl(url)) { account.lastUrl = url; save(); } });
  wc.on('before-input-event', (event, input) => handleShortcut(event, input));
  wc.on('render-process-gone', () => { cleanupView(account.id); suspended.add(account.id); broadcast(); });
  views.set(account.id, view);
  win.contentView.addChildView(view);
  void wc.loadURL(account.lastUrl && safeXUrl(account.lastUrl) ? account.lastUrl : 'https://x.com/home');
  broadcast();
  return view;
}
function reconcile() {
  const visible = new Set(visibleIds(settings));
  for (const [id, view] of views) {
    if (!visible.has(id) || suspended.has(id) || !rects.has(id)) {
      win.contentView.removeChildView(view);
      continue;
    }
    win.contentView.addChildView(view);
    view.setBounds(rects.get(id)!);
  }
  for (const id of visible) {
    if (suspended.has(id) || !rects.has(id) || views.has(id)) continue;
    const view = createView(accountFor(id));
    view.setBounds(rects.get(id)!);
  }
  broadcast();
}
function handleShortcut(event: Electron.Event, input: Electron.Input) {
  if (input.type !== 'keyDown') return;
  const key = input.key.toLowerCase();
  if (input.control && !input.alt && !input.meta) {
    if (/^[0-9]$/.test(key)) {
      const index = key === '0' ? 9 : Number(key) - 1;
      const target = [...settings.accounts].sort((a,b) => a.order - b.order)[index];
      if (target) { event.preventDefault(); settings.selectedId = target.id; save(); broadcast(); win.webContents.send('shortcut', `select:${target.id}`); }
    } else if (key === 'r' && !input.shift) {
      event.preventDefault(); const id = settings.selectedId; if (id) void runAction(id, 'reload');
    } else if (key === 'p' && input.shift) {
      event.preventDefault(); const id = settings.selectedId; if (id) void runAction(id, 'compose');
    }
  } else if (key === 'escape') win.webContents.send('shortcut', 'escape');
}
async function runAction(id: string, action: Action) {
  const account = accountFor(id);
  if (!allowedActions.includes(action)) throw new Error('INVALID_ACTION');
  if (suspended.has(id)) throw new Error('SUSPENDED');
  const view = views.get(id);
  if (!view) return;
  const wc = view.webContents;
  if (action === 'reload') wc.reload();
  else if (action === 'back' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  else if (action === 'forward' && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  else if (action === 'focus') wc.focus();
  else {
    const path = action === 'home' ? '/home' : action === 'notifications' ? '/notifications' : action === 'compose' ? '/compose/post' : account.handle ? `/${account.handle}` : '/settings/profile';
    await wc.loadURL(`https://x.com${path}`);
  }
}
function installIpc() {
  ipcMain.handle('snapshot', e => { guard(e); return snapshot(); });
  ipcMain.handle('account:save', (e, input: unknown) => {
    guard(e);
    const valid = validateAccount(input);
    const id = (input as Partial<Account>).id;
    if (id !== undefined) {
      const account = accountFor(id);
      Object.assign(account, valid);
      views.get(id)?.webContents.setZoomFactor(valid.zoom);
    } else {
      if (settings.accounts.length >= 10) throw new Error('ACCOUNT_LIMIT');
      const account: Account = { ...valid, id: randomUUID(), order: settings.accounts.length };
      settings.accounts.push(account);
      settings.selectedId = account.id;
    }
    save(); broadcast(); return snapshot();
  });
  ipcMain.handle('account:delete', async (e, id: unknown, clearSession: unknown) => {
    guard(e); accountFor(id);
    if (typeof clearSession !== 'boolean') throw new Error('INVALID_DELETE');
    cleanupView(id as string);
    if (clearSession) {
      const ses = session.fromPartition(partitionFor(id as string));
      await ses.clearData();
      await ses.clearCache();
      await ses.flushStorageData();
    }
    settings.accounts = settings.accounts.filter(a => a.id !== id).map((a,i) => ({...a, order:i}));
    suspended.delete(id as string);
    if (settings.selectedId === id) settings.selectedId = settings.accounts[0]?.id ?? null;
    saveNow(); reconcile(); return snapshot();
  });
  ipcMain.handle('account:reorder', (e, ids: unknown) => {
    guard(e);
    if (!Array.isArray(ids) || ids.length !== settings.accounts.length || ids.some(id => !isUuid(id)) || new Set(ids).size !== ids.length || ids.some(id => !settings.accounts.some(a => a.id === id))) throw new Error('INVALID_ORDER');
    settings.accounts = ids.map((id, order) => ({ ...accountFor(id), order })); save(); reconcile(); return snapshot();
  });
  ipcMain.handle('select', (e, id: unknown) => { guard(e); accountFor(id); settings.selectedId = id as string; save(); reconcile(); return snapshot(); });
  ipcMain.handle('layout', (e, layout: unknown) => { guard(e); if (!['single','two','four','six','ten','tabs'].includes(layout as string)) throw new Error('INVALID_LAYOUT'); settings.layout = layout as Layout; save(); reconcile(); return snapshot(); });
  ipcMain.handle('language', (e, language: unknown) => { guard(e); if (language !== 'ja' && language !== 'en') throw new Error('INVALID_LANGUAGE'); settings.language = language as Language; save(); broadcast(); return snapshot(); });
  ipcMain.handle('sidebar', (e, value: unknown) => { guard(e); if (typeof value !== 'boolean') throw new Error('INVALID_SETTINGS'); settings.sidebarCollapsed = value; save(); broadcast(); return snapshot(); });
  ipcMain.on('rects', (e, payload: unknown) => {
    guard(e);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
    rects.clear();
    for (const [id, raw] of Object.entries(payload)) {
      if (!settings.accounts.some(a => a.id === id) || !raw || typeof raw !== 'object') continue;
      const r = raw as Rect;
      if (![r.x,r.y,r.width,r.height].every(n => typeof n === 'number' && Number.isFinite(n)) || r.width < 1 || r.height < 1) continue;
      const bounds = win.getContentBounds();
      if (r.x < 0 || r.y < 0 || r.x + r.width > bounds.width + 2 || r.y + r.height > bounds.height + 2) continue;
      rects.set(id, {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)});
    }
    reconcile();
  });
  ipcMain.handle('action', async (e, id: unknown, action: unknown) => { guard(e); accountFor(id); if (!allowedActions.includes(action as Action)) throw new Error('INVALID_ACTION'); await runAction(id as string, action as Action); });
  ipcMain.handle('suspend', (e, id: unknown) => { guard(e); accountFor(id); cleanupView(id as string); suspended.add(id as string); broadcast(); return snapshot(); });
  ipcMain.handle('resume', (e, id: unknown) => { guard(e); accountFor(id); suspended.delete(id as string); reconcile(); return snapshot(); });
}
function createWindow() {
  win = new BrowserWindow({ ...settings.window, minWidth: 800, minHeight: 560, title: 'X Multi Workspace', backgroundColor: '#0a0d14', autoHideMenuBar: true,
    webPreferences: { preload: join(__dirname, '../preload/preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('before-input-event', (e, input) => handleShortcut(e, input));
  const saveBounds = () => { if (win.isMinimized()) return; settings.window = win.getBounds(); save(); };
  win.on('resize', saveBounds); win.on('move', saveBounds);
  win.on('closed', () => { for (const id of [...views.keys()]) cleanupView(id); saveNow(); });
  if (dev) void win.loadURL('http://127.0.0.1:5173'); else void win.loadFile(join(__dirname, '../../renderer/index.html'));
}
app.whenReady().then(() => {
  settingsPath = join(app.getPath('userData'), 'settings.json');
  const systemLanguage = languageFromLocale(app.getLocale());
  try { settings = normalizeSettings(JSON.parse(readFileSync(settingsPath, 'utf8')), systemLanguage); } catch { settings = normalizeSettings(null, systemLanguage); }
  installIpc(); createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
