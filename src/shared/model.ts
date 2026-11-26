export type Layout = 'single' | 'two' | 'four' | 'six' | 'ten' | 'tabs';
export type Language = 'ja' | 'en';
export type Account = { id: string; name: string; handle: string; color: string; order: number; zoom: number; lastUrl?: string };
export type Settings = { accounts: Account[]; layout: Layout; language: Language; selectedId: string | null; window: { x?: number; y?: number; width: number; height: number }; sidebarCollapsed: boolean };
export type ViewStatus = 'unloaded' | 'visible' | 'hidden' | 'suspended';
export type Snapshot = { settings: Settings; statuses: Record<string, ViewStatus> };
export type Action = 'home' | 'notifications' | 'profile' | 'compose' | 'reload' | 'back' | 'forward' | 'focus';
export type Rect = { x: number; y: number; width: number; height: number };
export const LAYOUT_COUNTS: Record<Layout, number> = { single: 1, two: 2, four: 4, six: 6, ten: 10, tabs: 1 };
export const DEFAULT_SETTINGS: Settings = { accounts: [], layout: 'single', language: 'ja', selectedId: null, window: { width: 1440, height: 900 }, sidebarCollapsed: false };
export const languageFromLocale = (locale: string): Language => /^ja(?:-|$)/i.test(locale) ? 'ja' : 'en';
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function partitionFor(id: string): string { if (!isUuid(id)) throw new Error('INVALID_ID'); return `persist:xmw-${id}`; }
export function validateAccount(input: unknown): Omit<Account, 'id' | 'order' | 'lastUrl'> {
  if (!input || typeof input !== 'object') throw new Error('INVALID_SETTINGS');
  const a = input as Record<string, unknown>;
  const name = typeof a.name === 'string' ? a.name.trim() : '';
  const handle = typeof a.handle === 'string' ? a.handle.trim().replace(/^@/, '') : '';
  if (!name || name.length > 60) throw new Error('INVALID_NAME');
  if (handle && !/^[A-Za-z0-9_]{1,15}$/.test(handle)) throw new Error('INVALID_HANDLE');
  if (!isColor(a.color)) throw new Error('INVALID_COLOR');
  if (typeof a.zoom !== 'number' || !Number.isFinite(a.zoom) || a.zoom < 0.5 || a.zoom > 2) throw new Error('INVALID_ZOOM');
  return { name, handle, color: a.color, zoom: Math.round(a.zoom * 10) / 10 };
}
export function normalizeSettings(input: unknown, fallbackLanguage: Language = 'ja'): Settings {
  if (!input || typeof input !== 'object') return { ...structuredClone(DEFAULT_SETTINGS), language: fallbackLanguage };
  const raw = input as Partial<Settings>;
  const accounts: Account[] = [];
  if (Array.isArray(raw.accounts)) for (const item of raw.accounts.slice(0, 10)) {
    try {
      if (!isUuid(item.id) || accounts.some(a => a.id === item.id)) continue;
      const valid = validateAccount(item);
      accounts.push({ ...valid, id: item.id, order: Number.isInteger(item.order) && item.order >= 0 && item.order < 10 ? item.order : accounts.length, lastUrl: safeXUrl(item.lastUrl) ? item.lastUrl : undefined });
    } catch { /* skip corrupt entry */ }
  }
  accounts.sort((a, b) => a.order - b.order).forEach((account, index) => { account.order = index; });
  const layout: Layout = ['single','two','four','six','ten','tabs'].includes(raw.layout as string) ? raw.layout as Layout : 'single';
  const w = raw.window;
  const width = Number.isFinite(w?.width) ? Math.max(800, Math.min(4000, w!.width)) : 1440;
  const height = Number.isFinite(w?.height) ? Math.max(560, Math.min(3000, w!.height)) : 900;
  const language: Language = raw.language === 'ja' || raw.language === 'en' ? raw.language : fallbackLanguage;
  return { accounts, layout, language, selectedId: accounts.some(a => a.id === raw.selectedId) ? raw.selectedId! : accounts[0]?.id ?? null,
    window: { width, height, ...(Number.isFinite(w?.x) && Number.isFinite(w?.y) ? { x: w!.x, y: w!.y } : {}) }, sidebarCollapsed: raw.sidebarCollapsed === true };
}
export function moveAccountId(ids: string[], source: string, target: string, after: boolean): string[] {
  if (source === target || !ids.includes(source) || !ids.includes(target)) return ids;
  const result = ids.filter(id => id !== source);
  result.splice(result.indexOf(target) + Number(after), 0, source);
  return result;
}
export function swapAccountIds(ids: string[], source: string, target: string): string[] {
  const result = [...ids];
  const from = result.indexOf(source), to = result.indexOf(target);
  if (from < 0 || to < 0 || from === to) return ids;
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}
export function safeXUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      (u.hostname === 'x.com' || u.hostname === 'twitter.com' || u.hostname === 'mobile.twitter.com');
  } catch { return false; }
}
export function safeExternalUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && !safeXUrl(value);
  } catch { return false; }
}
export function visibleIds(settings: Settings): string[] {
  const sorted = [...settings.accounts].sort((a,b) => a.order - b.order);
  const selectedIndex = Math.max(0, sorted.findIndex(a => a.id === settings.selectedId));
  const count = LAYOUT_COUNTS[settings.layout];
  if (count === 1) return sorted[selectedIndex] ? [sorted[selectedIndex].id] : [];
  const page = Math.floor(selectedIndex / count);
  return sorted.slice(page * count, page * count + count).map(a => a.id);
}
