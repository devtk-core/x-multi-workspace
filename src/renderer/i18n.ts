import type { Action, Language, Layout } from '../shared/model';

type Copy = {
  layouts: Record<Layout, string>;
  actions: Record<Action, string>;
  starting: string; collapseSidebar: string; expandSidebar: string; accounts: string;
  addSlot: string; idMissing: string; visible: string; suspended: string; waiting: string;
  shortcutSwitch: string; shortcutReload: string; workspace: string; startByAdding: string;
  restoreSplit: string; emptyTitle: string; emptyDescription: string; maximize: string;
  settings: string; suspendedTitle: string; sessionRetained: string; resume: string;
  editSlot: string; createSlot: string; displayName: string; displayPlaceholder: string;
  xUserId: string; optionalNoAt: string; usernamePlaceholder: string; color: string;
  browserZoom: string; moveUp: string; moveDown: string; suspend: string;
  memoryNote: string; delete: string; cancel: string; save: string; saving: string;
  deleteSlot: (name: string) => string; clearSession: string; suspendSlot: (name: string) => string;
  accountCount: (count: number) => string; languageSwitch: string; genericError: string;
  dragToReorder: string; dragToSwap: string;
  checkUpdates: string; checkingUpdates: string; updateAvailable: (version: string) => string;
  upToDate: (version: string) => string; updateUnavailable: string; openReleasePage: string; dismissUpdate: string;
  errors: Record<string, string>;
};

export const copy: Record<Language, Copy> = {
  ja: {
    layouts: {single:'1画面',two:'2分割',four:'4分割',six:'6分割',ten:'10分割',tabs:'タブ'},
    actions: {back:'戻る',forward:'進む',home:'ホーム',notifications:'通知',profile:'プロフィール',compose:'投稿',reload:'再読み込み',focus:'フォーカス'},
    starting:'Xnarabi を起動しています…', collapseSidebar:'サイドバーを折りたたむ', expandSidebar:'サイドバーを開く', accounts:'アカウント',
    addSlot:'管理枠を追加', idMissing:'ID未設定', visible:'表示中', suspended:'休止中', waiting:'待機中',
    shortcutSwitch:'Ctrl + 1～0 で切り替え', shortcutReload:'Ctrl + R で再読み込み', workspace:'ワークスペース', startByAdding:'管理枠を追加して開始',
    restoreSplit:'分割に戻る', emptyTitle:'アカウント管理枠を作成', emptyDescription:'管理枠ごとに独立したXのブラウザセッションを開きます。ログインはXの公式画面から行ってください。', maximize:'拡大表示',
    settings:'設定', suspendedTitle:'休止中', sessionRetained:'セッションは保持されています', resume:'復帰する',
    editSlot:'管理枠の設定', createSlot:'管理枠を追加', displayName:'表示名', displayPlaceholder:'例: 仕事用', xUserId:'XユーザーID', optionalNoAt:'任意・@なし', usernamePlaceholder:'username', color:'識別色',
    browserZoom:'ブラウザのズーム', moveUp:'↑ 前へ', moveDown:'↓ 後ろへ', suspend:'休止',
    memoryNote:'メモリの目安: X画面1枠あたり約100～200MB。8枠同時表示時はアプリ全体で約1.4GBでした。表示内容や動画で変動します。',
    delete:'削除', cancel:'キャンセル', save:'保存', saving:'保存中…',
    deleteSlot:name=>`「${name}」を管理枠から削除しますか？`,
    clearSession:'この管理枠のCookie・ローカルストレージなどのセッションデータも削除しますか？\n「キャンセル」を選ぶとデータを残して管理枠だけ削除します。',
    suspendSlot:name=>`「${name}」を休止しますか？編集中の投稿は失われる場合があります。`,
    accountCount:count=>`${count} アカウント`, languageSwitch:'Englishに切り替え', genericError:'操作に失敗しました。もう一度お試しください。', dragToReorder:'ドラッグして並べ替え', dragToSwap:'ここをドラッグして画面を入れ替え',
    checkUpdates:'更新を確認', checkingUpdates:'確認中…',
    updateAvailable:version=>`新しいバージョン ${version} を利用できます。`,
    upToDate:version=>`最新版です（${version}）。`,
    updateUnavailable:'更新情報を取得できませんでした。リポジトリが非公開の場合は、GitHubにログインして確認してください。',
    openReleasePage:'GitHub Releasesを開く', dismissUpdate:'閉じる',
    errors: {INVALID_SETTINGS:'設定が不正です',INVALID_ID:'アカウントIDが不正です',ACCOUNT_NOT_FOUND:'アカウントが見つかりません',INVALID_SENDER:'IPCの送信元が不正です',INVALID_ACTION:'操作が不正です',SUSPENDED:'休止中の画面を復帰してください',ACCOUNT_LIMIT:'管理枠は最大10個です',INVALID_DELETE:'削除指定が不正です',INVALID_ORDER:'並び順が不正です',INVALID_LAYOUT:'表示形式が不正です',INVALID_NAME:'表示名は1～60文字で入力してください',INVALID_HANDLE:'ユーザーIDは英数字と_の15文字以内で入力してください',INVALID_COLOR:'識別色が不正です',INVALID_ZOOM:'ズームは50～200%にしてください',INVALID_LANGUAGE:'言語設定が不正です'}
  },
  en: {
    layouts: {single:'Single',two:'2 panes',four:'4 panes',six:'6 panes',ten:'10 panes',tabs:'Tabs'},
    actions: {back:'Back',forward:'Forward',home:'Home',notifications:'Notifications',profile:'Profile',compose:'Compose',reload:'Reload',focus:'Focus'},
    starting:'Starting Xnarabi…', collapseSidebar:'Collapse sidebar', expandSidebar:'Expand sidebar', accounts:'Accounts',
    addSlot:'Add workspace', idMissing:'No handle', visible:'Visible', suspended:'Suspended', waiting:'Idle',
    shortcutSwitch:'Ctrl + 1–0 to switch', shortcutReload:'Ctrl + R to reload', workspace:'Workspace', startByAdding:'Add a workspace to begin',
    restoreSplit:'Restore layout', emptyTitle:'Create an account workspace', emptyDescription:'Each workspace opens X in its own browser session. Sign in manually on the official X website.', maximize:'Maximize',
    settings:'Settings', suspendedTitle:'Suspended', sessionRetained:'Your session is retained', resume:'Resume',
    editSlot:'Workspace settings', createSlot:'Add workspace', displayName:'Display name', displayPlaceholder:'e.g. Work', xUserId:'X handle', optionalNoAt:'Optional, without @', usernamePlaceholder:'username', color:'Color',
    browserZoom:'Browser zoom', moveUp:'↑ Move up', moveDown:'↓ Move down', suspend:'Suspend',
    memoryNote:'Memory estimate: about 100–200 MB per X view. Eight visible views used about 1.4 GB for the whole app in one test. Usage varies with content and video.',
    delete:'Delete', cancel:'Cancel', save:'Save', saving:'Saving…',
    deleteSlot:name=>`Remove “${name}” from the app?`,
    clearSession:'Also delete this workspace’s cookies and local storage?\nChoose Cancel to remove only the workspace and keep its session data.',
    suspendSlot:name=>`Suspend “${name}”? Any post you are editing may be lost.`,
    accountCount:count=>`${count} ${count===1?'account':'accounts'}`, languageSwitch:'Switch to Japanese', genericError:'The action failed. Please try again.', dragToReorder:'Drag to reorder', dragToSwap:'Drag here to swap screens',
    checkUpdates:'Check for updates', checkingUpdates:'Checking…',
    updateAvailable:version=>`Version ${version} is available.`,
    upToDate:version=>`You're up to date (${version}).`,
    updateUnavailable:'Could not check for updates. If the repository is private, sign in to GitHub to check.',
    openReleasePage:'Open GitHub Releases', dismissUpdate:'Dismiss',
    errors: {INVALID_SETTINGS:'Invalid settings',INVALID_ID:'Invalid account ID',ACCOUNT_NOT_FOUND:'Account not found',INVALID_SENDER:'Invalid IPC sender',INVALID_ACTION:'Invalid action',SUSPENDED:'Resume this workspace first',ACCOUNT_LIMIT:'You can add up to 10 workspaces',INVALID_DELETE:'Invalid deletion option',INVALID_ORDER:'Invalid account order',INVALID_LAYOUT:'Invalid layout',INVALID_NAME:'Enter a display name of 1–60 characters',INVALID_HANDLE:'The X handle must be up to 15 letters, numbers, or underscores',INVALID_COLOR:'Invalid color',INVALID_ZOOM:'Zoom must be between 50% and 200%',INVALID_LANGUAGE:'Invalid language'}
  }
};

export function errorText(error: unknown, language: Language): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = /\b(INVALID_[A-Z_]+|ACCOUNT_NOT_FOUND|ACCOUNT_LIMIT|SUSPENDED)\b/.exec(message)?.[1];
  return code ? copy[language].errors[code] ?? copy[language].genericError : copy[language].genericError;
}
