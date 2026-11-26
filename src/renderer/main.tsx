import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LAYOUT_COUNTS, moveAccountId, swapAccountIds, visibleIds, type Account, type Action, type Language, type Layout, type Rect, type Snapshot } from '../shared/model';
import { copy, errorText } from './i18n';
import type { UpdateCheck } from '../shared/updates';
import './style.css';

const actionIcons: { id: Action; icon: string }[] = [
  { id: 'back', icon: '←' }, { id: 'forward', icon: '→' }, { id: 'home', icon: '⌂' },
  { id: 'notifications', icon: '♢' }, { id: 'profile', icon: '' },
  { id: 'compose', icon: '✎' }, { id: 'reload', icon: '⟳' }
];
const colors = ['#33c2a5','#4e9af1','#b78cf6','#f3a35c','#ef6f86','#d6c65e','#5bc6e8','#e483c3','#a2ca72','#f08365'];

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const [maximized, setMaximized] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dropHint, setDropHint] = useState<{ id: string; where: 'before' | 'after' | 'swap' } | null>(null);
  const draggedId = useRef<string | null>(null);
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const settings = snapshot?.settings;
  const language = settings?.language ?? 'ja';
  const t = copy[language];
  const ids = settings ? (maximized ? [maximized] : visibleIds(settings)) : [];

  useEffect(() => { void window.workspace.snapshot().then(setSnapshot); return window.workspace.onSnapshot(setSnapshot); }, []);
  useEffect(() => window.workspace.onShortcut(key => {
    if (key === 'escape') setMaximized(null);
    else if (key.startsWith('select:')) { setMaximized(null); void window.workspace.select(key.slice(7)); }
  }), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  useLayoutEffect(() => {
    if (!snapshot) return;
    let frame = 0;
    const send = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rects: Record<string, Rect> = {};
        for (const id of editing ? [] : ids) {
          const el = bodyRefs.current[id]; if (!el) continue;
          const r = el.getBoundingClientRect();
          rects[id] = { x: r.x, y: r.y, width: r.width, height: r.height };
        }
        window.workspace.setRects(rects);
      });
    };
    const observer = new ResizeObserver(send);
    for (const id of ids) if (bodyRefs.current[id]) observer.observe(bodyRefs.current[id]!);
    window.addEventListener('resize', send); send();
    return () => { observer.disconnect(); window.removeEventListener('resize', send); cancelAnimationFrame(frame); };
  }, [snapshot?.settings.layout, snapshot?.settings.selectedId, snapshot?.settings.sidebarCollapsed, snapshot?.settings.accounts.length, snapshot?.settings.language, maximized, editing, ids.join('|')]);

  async function call<T>(request: () => Promise<T>) {
    try { setError(''); return await request(); }
    catch (e) { setError(errorText(e, language)); }
  }
  async function changeLayout(layout: Layout) { setMaximized(null); await call(() => window.workspace.layout(layout)); }
  async function select(id: string) { setMaximized(null); await call(() => window.workspace.select(id)); }
  async function move(id: string, direction: number) {
    if (!settings) return;
    const order = [...settings.accounts].sort((a,b) => a.order-b.order).map(a => a.id);
    const i = order.indexOf(id), j = i + direction; if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    await call(() => window.workspace.reorder(order));
  }
  function startDrag(event: React.DragEvent, id: string) {
    if (event.currentTarget.classList.contains('tile-header') && (event.target as HTMLElement).closest('button')) { event.preventDefault(); return; }
    draggedId.current = id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-xmw-account', id);
  }
  function endDrag() { draggedId.current = null; setDropHint(null); }
  function dragOver(event: React.DragEvent, id: string, where: 'sidebar' | 'tile') {
    if (!draggedId.current || draggedId.current === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const side = where === 'tile' ? 'swap' : event.clientY < event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2 ? 'before' : 'after';
    if (dropHint?.id !== id || dropHint.where !== side) setDropHint({ id, where: side });
  }
  async function drop(event: React.DragEvent, id: string, where: 'sidebar' | 'tile') {
    event.preventDefault();
    const source = draggedId.current;
    endDrag();
    if (!source || !settings || source === id) return;
    const order = [...settings.accounts].sort((a,b) => a.order-b.order).map(a => a.id);
    const next = where === 'tile' ? swapAccountIds(order, source, id) : moveAccountId(order, source, id, event.clientY >= event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2);
    if (next !== order) await call(() => window.workspace.reorder(next));
  }
  async function deleteAccount(account: Account) {
    if (!confirm(t.deleteSlot(account.name))) return;
    const clear = confirm(t.clearSession);
    await call(() => window.workspace.deleteAccount(account.id, clear)); setEditing(null);
  }
  async function suspend(account: Account) {
    if (!confirm(t.suspendSlot(account.name))) return;
    await call(() => window.workspace.suspend(account.id));
  }
  async function checkUpdates() {
    setCheckingUpdate(true);
    try { setUpdate(await window.workspace.checkUpdates()); }
    catch { setUpdate({ status: 'unavailable', currentVersion: '' }); }
    finally { setCheckingUpdate(false); }
  }

  if (!settings) return <div className="loading">{t.starting}</div>;
  const ordered = [...settings.accounts].sort((a,b) => a.order-b.order);
  const count = maximized ? 1 : LAYOUT_COUNTS[settings.layout];
  const columns = count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : count === 6 ? 3 : 5;
  return <div className="app">
    <aside className={`sidebar ${settings.sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand"><span className="brand-mark">𝕏</span>{!settings.sidebarCollapsed && <span><strong>Multi Workspace</strong><small>ACCOUNT CONTROL</small></span>}<button className="icon-button collapse" title={settings.sidebarCollapsed ? t.expandSidebar : t.collapseSidebar} onClick={() => void call(() => window.workspace.collapseSidebar(!settings.sidebarCollapsed))}>{settings.sidebarCollapsed ? '»' : '«'}</button></div>
      {!settings.sidebarCollapsed && <div className="sidebar-title"><span>{t.accounts} <em>{ordered.length}/10</em></span><button className="add-small" disabled={ordered.length>=10} title={t.addSlot} onClick={() => setEditing('new')}>＋</button></div>}
      <div className="account-list">{ordered.map((a,i) => <button key={a.id} className={`account-row ${settings.selectedId === a.id ? 'selected' : ''} ${dropHint?.id === a.id ? `drop-${dropHint.where}` : ''}`} draggable onDragStart={e => startDrag(e,a.id)} onDragEnd={endDrag} onDragOver={e => dragOver(e,a.id,'sidebar')} onDrop={e => void drop(e,a.id,'sidebar')} onClick={() => void select(a.id)} title={`${a.name} · Ctrl+${(i+1)%10} · ${t.dragToReorder}`}>
        <span className="avatar" style={{background:a.color}}>{a.name.slice(0,1).toUpperCase()}</span>
        {!settings.sidebarCollapsed && <span className="account-text"><strong>{a.name}</strong><small>{a.handle ? '@'+a.handle : t.idMissing} <span className={`status ${snapshot.statuses[a.id]}`}>● {snapshot.statuses[a.id] === 'visible' ? t.visible : snapshot.statuses[a.id] === 'suspended' ? t.suspended : t.waiting}</span></small></span>}
      </button>)}</div>
      {settings.sidebarCollapsed && ordered.length < 10 && <button className="add-collapsed" title={t.addSlot} onClick={() => setEditing('new')}>＋</button>}
      {!settings.sidebarCollapsed && <div className="sidebar-footer"><span>{t.shortcutSwitch}</span><span>{t.shortcutReload}</span></div>}
    </aside>
    <main className="main">
      <header className="topbar"><div className="heading"><strong>{t.workspace}</strong><span>{ordered.length ? t.accountCount(ordered.length) : t.startByAdding}</span></div><div className="layouts">{(Object.keys(t.layouts) as Layout[]).map(l => <button key={l} className={settings.layout===l && !maximized ? 'active' : ''} onClick={() => void changeLayout(l)}>{t.layouts[l]}</button>)}</div><button className="update-button" title={t.checkUpdates} aria-label={t.checkUpdates} disabled={checkingUpdate} onClick={() => void checkUpdates()}>{checkingUpdate ? t.checkingUpdates : t.checkUpdates}</button><button className="language-toggle" title={t.languageSwitch} aria-label={t.languageSwitch} onClick={() => void call(() => window.workspace.language(language === 'ja' ? 'en' : 'ja'))}>{language === 'ja' ? 'EN' : '日本語'}</button>{maximized && <button className="restore" onClick={() => setMaximized(null)}>{t.restoreSplit}　Esc</button>}</header>
      {update && <div className="update-notice" role="status"><span>{update.status === 'available' ? t.updateAvailable(update.latestVersion!) : update.status === 'current' ? t.upToDate(update.currentVersion) : t.updateUnavailable}</span>{update.status !== 'current' && <button onClick={() => void call(() => window.workspace.openReleasePage())}>{t.openReleasePage}</button>}<button className="update-dismiss" aria-label={t.dismissUpdate} title={t.dismissUpdate} onClick={() => setUpdate(null)}>×</button></div>}
      {error && <div className="error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
      {ordered.length === 0 ? <div className="empty"><div className="empty-symbol">𝕏</div><h1>{t.emptyTitle}</h1><p>{t.emptyDescription}</p><button className="primary" onClick={() => setEditing('new')}>＋ {t.addSlot}</button></div> :
      <div className={`grid count-${count}`} style={{gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`}}>{ids.map(id => {
        const account = ordered.find(a => a.id===id)!;
        const isSuspended = snapshot.statuses[id]==='suspended';
        return <section className={`tile ${settings.selectedId===id?'focused':''}`} key={id} style={{'--accent':account.color} as React.CSSProperties} onMouseDown={() => { if (settings.selectedId!==id) void window.workspace.select(id); }}>
          <div className={`tile-header ${dropHint?.id === id && dropHint.where === 'swap' ? 'drop-swap' : ''}`} draggable onDragStart={e => startDrag(e,id)} onDragEnd={endDrag} onDragOver={e => dragOver(e,id,'tile')} onDrop={e => void drop(e,id,'tile')} title={t.dragToSwap}><div className="tile-identity"><span className="tile-dot" style={{background:account.color}}/><strong>{account.name}</strong><small>{account.handle ? '@'+account.handle : ''}</small></div><div className="tile-actions">{actionIcons.map(a => <button key={a.id} className={a.id === 'profile' ? 'profile-action' : undefined} title={t.actions[a.id]} aria-label={`${account.name}: ${t.actions[a.id]}`} disabled={isSuspended} onClick={() => void call(() => window.workspace.action(id,a.id))}>{a.id === 'profile' ? <><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 20v-1.5a7.5 7.5 0 0 1 15 0V20z"/></svg><span className="profile-label">{t.actions.profile}</span></> : a.icon}</button>)}<button title={maximized ? t.restoreSplit : t.maximize} aria-label={maximized ? t.restoreSplit : t.maximize} onClick={() => setMaximized(maximized ? null : id)}>{maximized ? '▣' : '⛶'}</button><button className="more" title={t.settings} aria-label={t.settings} onClick={() => setEditing(account)}>⋯</button></div></div>
          <div className="browser-area" ref={el => {bodyRefs.current[id]=el;}}>{isSuspended && <div className="suspended-message"><span>◌</span><strong>{t.suspendedTitle}</strong><p>{t.sessionRetained}</p><button className="primary" onClick={() => void call(() => window.workspace.resume(id))}>{t.resume}</button></div>}</div>
        </section>;
      })}</div>}
    </main>
    {editing && <Editor key={editing==='new'?'new':editing.id} account={editing==='new'?null:editing} language={language} busy={busy} onClose={() => setEditing(null)} onSave={async data => {setBusy(true); const result = await call(() => window.workspace.saveAccount(data)); setBusy(false); if(result) setEditing(null);}} onDelete={editing==='new'?undefined:() => void deleteAccount(editing)} onMove={editing==='new'?undefined:(delta) => void move(editing.id,delta)} onSuspend={editing==='new'?undefined:() => {void suspend(editing);setEditing(null);}} onResume={editing==='new'?undefined:() => {void call(() => window.workspace.resume(editing.id));setEditing(null);}} isSuspended={editing!=='new' && snapshot.statuses[editing.id]==='suspended'} />}
  </div>;
}

function Editor({account,language,busy,onClose,onSave,onDelete,onMove,onSuspend,onResume,isSuspended}:{account:Account|null;language:Language;busy:boolean;onClose:()=>void;onSave:(data:Partial<Account>)=>void;onDelete?:()=>void;onMove?:(delta:number)=>void;onSuspend?:()=>void;onResume?:()=>void;isSuspended:boolean}) {
  const t = copy[language];
  const [name,setName]=useState(account?.name ?? ''); const [handle,setHandle]=useState(account?.handle ?? ''); const [color,setColor]=useState(account?.color ?? colors[0]); const [zoom,setZoom]=useState(account?.zoom ?? 1);
  return <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)onClose();}}><form className="modal" onSubmit={e => {e.preventDefault();onSave({id:account?.id,name,handle,color,zoom});}}><div className="modal-heading"><h2>{account?t.editSlot:t.createSlot}</h2><button type="button" className="icon-button" onClick={onClose}>×</button></div><label>{t.displayName}<input autoFocus maxLength={60} required value={name} onChange={e=>setName(e.target.value)} placeholder={t.displayPlaceholder} /></label><label>{t.xUserId} <small>{t.optionalNoAt}</small><input maxLength={15} value={handle} onChange={e=>setHandle(e.target.value.replace(/^@/,''))} placeholder={t.usernamePlaceholder} /></label><label>{t.color}<div className="colors">{colors.map(c=><button type="button" key={c} className={color===c?'picked':''} style={{background:c}} onClick={()=>setColor(c)} aria-label={`${t.color} ${c}`}/>)}</div></label><label>{t.browserZoom}　{Math.round(zoom*100)}%<input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>{account && <div className="settings-actions"><button type="button" onClick={()=>onMove?.(-1)}>{t.moveUp}</button><button type="button" onClick={()=>onMove?.(1)}>{t.moveDown}</button><button type="button" onClick={isSuspended?onResume:onSuspend}>{isSuspended?t.resume:t.suspend}</button></div>}<p className="memory-note">{t.memoryNote}</p><div className="modal-footer">{account && <button type="button" className="danger" onClick={onDelete}>{t.delete}</button>}<button type="button" onClick={onClose}>{t.cancel}</button><button type="submit" className="primary" disabled={busy}>{busy?t.saving:t.save}</button></div></form></div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
