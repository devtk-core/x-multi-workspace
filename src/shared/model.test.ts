import { describe, expect, it } from 'vitest';
import { normalizeSettings, partitionFor, safeXUrl, validateAccount, visibleIds, type Settings } from './model';
const ids = Array.from({length:10},(_,i)=>`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`);
const settings:Settings = {accounts:ids.map((id,order)=>({id,order,name:`Account ${order}`,handle:`user_${order}`,color:'#33c2a5',zoom:1})),layout:'four',selectedId:ids[5],sidebarCollapsed:false,window:{width:1440,height:900}};
describe('account model',()=>{
  it('rejects invalid names, handles and zoom',()=>{
    expect(()=>validateAccount({name:'',handle:'',color:'#fff000',zoom:1})).toThrow();
    expect(()=>validateAccount({name:'ok',handle:'bad handle',color:'#fff000',zoom:1})).toThrow();
    expect(()=>validateAccount({name:'ok',handle:'',color:'#fff000',zoom:3})).toThrow();
  });
  it('limits loaded accounts to ten and repairs selection',()=>{
    const loaded=normalizeSettings({...settings,accounts:[...settings.accounts,{...settings.accounts[0],id:'00000000-0000-4000-8000-000000000010'}],selectedId:'missing'});
    expect(loaded.accounts).toHaveLength(10);
    expect(loaded.selectedId).toBe(ids[0]);
  });
  it('keeps external and insecure URLs out of account views',()=>{
    expect(safeXUrl('https://x.com/home')).toBe(true);
    expect(safeXUrl('https://x.com.evil.example/home')).toBe(false);
    expect(safeXUrl('http://x.com/home')).toBe(false);
  });
  it('gives each account a separate persistent partition',()=>{
    expect(partitionFor(ids[0])).toBe(`persist:xmw-${ids[0]}`);
    expect(partitionFor(ids[0])).not.toBe(partitionFor(ids[1]));
  });
  it('paginates split layouts around the selected account',()=>{
    expect(visibleIds(settings)).toEqual(ids.slice(4,8));
    expect(visibleIds({...settings,layout:'single'})).toEqual([ids[5]]);
    expect(visibleIds({...settings,layout:'ten'})).toEqual(ids);
  });
});
