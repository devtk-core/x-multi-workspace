import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LAYOUT_COUNTS, visibleIds, type Account, type Action, type Layout, type Rect, type Snapshot } from '../shared/model';
import './style.css';

const layoutNames: Record<Layout,string> = {single:'1画面',two:'2分割',four:'4分割',six:'6分割',ten:'10分割',tabs:'タブ'};
const actions: {id:Action; label:string; icon:string}[] = [
  {id:'back',label:'戻る',icon:'←'}, {id:'forward',label:'進む',icon:'→'}, {id:'home',label:'ホーム',icon:'⌂'},
  {id:'notifications',label:'通知',icon:'♢'}, {id:'profile',label:'プロフィール',icon:'◎'},
  {id:'compose',label:'投稿',icon:'✎'}, {id:'reload',label:'再読み込み',icon:'⟳'}
];
const colors = ['#33c2a5','#4e9af1','#b78cf6','#f3a35c','#ef6f86','#d6c65e','#5bc6e8','#e483c3','#a2ca72','#f08365'];
function App() {
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null);
  const [editing,setEditing] = useState<Account | 'new' | null>(null);
  const [maximized,setMaximized] = useState<string|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const bodyRefs = useRef<Record<string,HTMLDivElement|null>>({});
  useEffect(() => { void window.workspace.snapshot().then(setSnapshot); return window.workspace.onSnapshot(setSnapshot); },[]);
  useEffect(() => window.workspace.onShortcut(key => {
    if (key === 'escape') setMaximized(null);
    else if (key.startsWith('select:')) { setMaximized(null); void window.workspace.select(key.slice(7)); }
  }),[]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(null); }; window.addEventListener('keydown',onKey); return () => window.removeEventListener('keydown',onKey); },[]);
  const settings = snapshot?.settings;
  const ids = settings ? (maximized ? [maximized] : visibleIds(settings)) : [];
  useLayoutEffect(() => {
    if (!snapshot) return;
    let frame = 0;
    const send = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rects: Record<string,Rect> = {};
        for (const id of editing ? [] : ids) {
          const el = bodyRefs.current[id]; if (!el) continue;
          const r = el.getBoundingClientRect();
          rects[id] = {x:r.x,y:r.y,width:r.width,height:r.height};
        }
        window.workspace.setRects(rects);
      });
    };
    const observer = new ResizeObserver(send);
    for (const id of ids) if (bodyRefs.current[id]) observer.observe(bodyRefs.current[id]!);
    window.addEventListener('resize',send); send();
    return () => { observer.disconnect(); window.removeEventListener('resize',send); cancelAnimationFrame(frame); };
  },[snapshot?.settings.layout,snapshot?.settings.selectedId,snapshot?.settings.sidebarCollapsed,snapshot?.settings.accounts.length,maximized,editing,ids.join('|')]);
  async function call<T>(request: () => Promise<T>) { try { setError(''); return await request(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  async function changeLayout(layout: Layout) { setMaximized(null); await call(() => window.workspace.layout(layout)); }
  async function select(id: string) { setMaximized(null); await call(() => window.workspace.select(id)); }
  async function move(id: string, direction: number) {
    if (!settings) return;
    const order = [...settings.accounts].sort((a,b) => a.order-b.order).map(a => a.id);
    const i = order.indexOf(id), j = i + direction; if (j < 0 || j >= order.length) return;
    [order[i],order[j]] = [order[j],order[i]];
    await call(() => window.workspace.reorder(order));
  }
  async function deleteAccount(account: Account) {
    if (!confirm(`「${account.name}」を管理枠から削除しますか？`)) return;
    const clear = confirm('この管理枠のCookie・ローカルストレージなどのセッションデータも削除しますか？\n「キャンセル」を選ぶとデータを残して管理枠だけ削除します。');
    await call(() => window.workspace.deleteAccount(account.id,clear)); setEditing(null);
  }
  async function suspend(account: Account) {
    if (!confirm(`「${account.name}」を休止しますか？編集中の投稿は失われる場合があります。`)) return;
    await call(() => window.workspace.suspend(account.id));
  }
  if (!settings) return <div className="loading">X Multi Workspace を起動しています…</div>;
  const ordered = [...settings.accounts].sort((a,b) => a.order-b.order);
  const count = maximized ? 1 : LAYOUT_COUNTS[settings.layout];
  const columns = count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : count === 6 ? 3 : 5;
  return <div className="app">
    <aside className={`sidebar ${settings.sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand"><span className="brand-mark">𝕏</span>{!settings.sidebarCollapsed && <span><strong>Multi Workspace</strong><small>ACCOUNT CONTROL</small></span>}<button className="icon-button collapse" title="サイドバーを折りたたむ" onClick={() => void call(() => window.workspace.collapseSidebar(!settings.sidebarCollapsed))}>{settings.sidebarCollapsed ? '»' : '«'}</button></div>
      {!settings.sidebarCollapsed && <div className="sidebar-title"><span>アカウント <em>{ordered.length}/10</em></span><button className="add-small" disabled={ordered.length>=10} title="管理枠を追加" onClick={() => setEditing('new')}>＋</button></div>}
      <div className="account-list">{ordered.map((a,i) => <button key={a.id} className={`account-row ${settings.selectedId === a.id ? 'selected' : ''}`} onClick={() => void select(a.id)} title={`${a.name} · Ctrl+${(i+1)%10}`}>
        <span className="avatar" style={{background:a.color}}>{a.name.slice(0,1).toUpperCase()}</span>
        {!settings.sidebarCollapsed && <span className="account-text"><strong>{a.name}</strong><small>{a.handle ? '@'+a.handle : 'ID未設定'} <span className={`status ${snapshot.statuses[a.id]}`}>● {snapshot.statuses[a.id] === 'visible' ? '表示中' : snapshot.statuses[a.id] === 'suspended' ? '休止中' : '待機中'}</span></small></span>}
      </button>)}</div>
      {settings.sidebarCollapsed && ordered.length < 10 && <button className="add-collapsed" title="管理枠を追加" onClick={() => setEditing('new')}>＋</button>}
      {!settings.sidebarCollapsed && <div className="sidebar-footer"><span>Ctrl + 1～0 で切り替え</span><span>Ctrl + R で再読み込み</span></div>}
    </aside>
    <main className="main">
      <header className="topbar"><div className="heading"><strong>ワークスペース</strong><span>{ordered.length ? `${ordered.length} アカウント` : '管理枠を追加して開始'}</span></div><div className="layouts">{(Object.keys(layoutNames) as Layout[]).map(l => <button key={l} className={settings.layout===l && !maximized ? 'active' : ''} onClick={() => void changeLayout(l)}>{layoutNames[l]}</button>)}</div>{maximized && <button className="restore" onClick={() => setMaximized(null)}>分割に戻る　Esc</button>}</header>
      {error && <div className="error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
      {ordered.length === 0 ? <div className="empty"><div className="empty-symbol">𝕏</div><h1>アカウント管理枠を作成</h1><p>管理枠ごとに独立したXのブラウザセッションを開きます。ログインはXの公式画面から行ってください。</p><button className="primary" onClick={() => setEditing('new')}>＋ 管理枠を追加</button></div> :
      <div className={`grid count-${count}`} style={{gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`}}>{ids.map(id => {
        const account = ordered.find(a => a.id===id)!;
        const suspended = snapshot.statuses[id]==='suspended';
        return <section className={`tile ${settings.selectedId===id?'focused':''}`} key={id} style={{'--accent':account.color} as React.CSSProperties} onMouseDown={() => { if (settings.selectedId!==id) void window.workspace.select(id); }}>
          <div className="tile-header"><div className="tile-identity"><span className="tile-dot" style={{background:account.color}}/><strong>{account.name}</strong><small>{account.handle ? '@'+account.handle : ''}</small></div><div className="tile-actions">{actions.map(a => <button key={a.id} title={a.label} aria-label={`${account.name}: ${a.label}`} disabled={suspended} onClick={() => void call(() => window.workspace.action(id,a.id))}>{a.icon}</button>)}<button title={maximized ? '分割に戻る' : '拡大表示'} aria-label="拡大表示" onClick={() => setMaximized(maximized ? null : id)}>{maximized ? '▣' : '⛶'}</button><button className="more" title="設定" aria-label="設定" onClick={() => setEditing(account)}>⋯</button></div></div>
          <div className="browser-area" ref={el => {bodyRefs.current[id]=el;}}>{suspended && <div className="suspended-message"><span>◌</span><strong>休止中</strong><p>セッションは保持されています</p><button className="primary" onClick={() => void call(() => window.workspace.resume(id))}>復帰する</button></div>}</div>
        </section>;
      })}</div>}
    </main>
    {editing && <Editor account={editing==='new'?null:editing} busy={busy} onClose={() => setEditing(null)} onSave={async data => {setBusy(true); const result = await call(() => window.workspace.saveAccount(data)); setBusy(false); if(result) setEditing(null);}} onDelete={editing==='new'?undefined:() => void deleteAccount(editing)} onMove={editing==='new'?undefined:(delta) => void move(editing.id,delta)} onSuspend={editing==='new'?undefined:() => {void suspend(editing);setEditing(null);}} onResume={editing==='new'?undefined:() => {void call(() => window.workspace.resume(editing.id));setEditing(null);}} isSuspended={editing!=='new' && snapshot.statuses[editing.id]==='suspended'} />}
  </div>;
}
function Editor({account,busy,onClose,onSave,onDelete,onMove,onSuspend,onResume,isSuspended}:{account:Account|null;busy:boolean;onClose:()=>void;onSave:(data:Partial<Account>)=>void;onDelete?:()=>void;onMove?:(delta:number)=>void;onSuspend?:()=>void;onResume?:()=>void;isSuspended:boolean}) {
  const [name,setName]=useState(account?.name ?? ''); const [handle,setHandle]=useState(account?.handle ?? ''); const [color,setColor]=useState(account?.color ?? colors[0]); const [zoom,setZoom]=useState(account?.zoom ?? 1);
  return <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)onClose();}}><form className="modal" onSubmit={e => {e.preventDefault();onSave({id:account?.id,name,handle,color,zoom});}}><div className="modal-heading"><h2>{account?'管理枠の設定':'管理枠を追加'}</h2><button type="button" className="icon-button" onClick={onClose}>×</button></div><label>表示名<input autoFocus maxLength={60} required value={name} onChange={e=>setName(e.target.value)} placeholder="例: 仕事用" /></label><label>XユーザーID <small>任意・@なし</small><input maxLength={15} value={handle} onChange={e=>setHandle(e.target.value.replace(/^@/,''))} placeholder="username" /></label><label>識別色<div className="colors">{colors.map(c=><button type="button" key={c} className={color===c?'picked':''} style={{background:c}} onClick={()=>setColor(c)} aria-label={`色 ${c}`}/>)}</div></label><label>ブラウザのズーム　{Math.round(zoom*100)}%<input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>{account && <div className="settings-actions"><button type="button" onClick={()=>onMove?.(-1)}>↑ 前へ</button><button type="button" onClick={()=>onMove?.(1)}>↓ 後ろへ</button><button type="button" onClick={isSuspended?onResume:onSuspend}>{isSuspended?'復帰':'休止'}</button></div>}<div className="modal-footer">{account && <button type="button" className="danger" onClick={onDelete}>削除</button>}<button type="button" onClick={onClose}>キャンセル</button><button type="submit" className="primary" disabled={busy}>{busy?'保存中…':'保存'}</button></div></form></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
