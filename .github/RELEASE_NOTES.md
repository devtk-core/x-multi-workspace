# X Multi Workspace v1.1.4

Windows 11 x64向けのインストーラー版・ポータブル版です。既存の管理枠と有効なXログインセッションは、同じWindowsユーザーで更新する場合に引き継がれます。

## 主な変更

- サイドバーをドラッグして管理枠を並べ替え、画面上部のバーをドラッグして表示位置を交換できます。順序は再起動後も保持されます。
- プロフィール操作を人物アイコンに変更。幅に余裕がある画面では文字も表示します。
- 「更新を確認」を追加。操作したときだけGitHub Releasesを確認し、新版があれば配布ページを開けます。自動インストールは行いません。
- 画面遷移、IPC、権限、Electronのパッケージ設定を見直し、CIに依存関係監査と秘密情報スキャンを追加しました。

投稿、画像・動画の添付、ログインはX公式サイト上で手動操作します。X APIは使用しません。exeは未署名です。ダウンロード後は `SHA256SUMS.txt` でファイルを照合できます。

---

Windows 11 x64 installer and portable builds. Workspace order now supports drag and drop and persists across restarts. The Profile action has a clearer icon and text where space allows. Check for updates contacts GitHub Releases only when requested and opens the download page; it does not install updates automatically. Navigation, IPC, permissions, and packaging were hardened. Sign-in and posting stay on the official X website. The executables are unsigned; verify them with `SHA256SUMS.txt`.
