import type { Account, Action, Language, Layout, Rect, Snapshot } from '../shared/model';
declare global {
  interface Window { workspace: {
    snapshot(): Promise<Snapshot>; saveAccount(account: Partial<Account>): Promise<Snapshot>;
    deleteAccount(id: string, clearSession: boolean): Promise<Snapshot>; reorder(ids: string[]): Promise<Snapshot>;
    select(id: string): Promise<Snapshot>; layout(layout: Layout): Promise<Snapshot>; language(language: Language): Promise<Snapshot>; collapseSidebar(value: boolean): Promise<Snapshot>;
    setRects(rects: Record<string, Rect>): void; action(id: string, action: Action): Promise<void>;
    suspend(id: string): Promise<Snapshot>; resume(id: string): Promise<Snapshot>;
    onSnapshot(cb: (state: Snapshot) => void): () => void; onShortcut(cb: (key: string) => void): () => void;
  } }
}
export {};
