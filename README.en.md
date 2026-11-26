# X Multi Workspace

<img src="build/icon.svg" alt="X Multi Workspace icon" width="96" height="96">

English | [日本語](README.md)

## Up to 10 X accounts. One window.

Open multiple X screens side by side in a Windows desktop app. Each workspace shows the **official X website** and keeps its own login session, so you can switch between accounts without signing in and out.

[Download the installer or portable app](https://github.com/devtk-core/x-multi-workspace/releases/latest) · Windows 11 x64

![Illustrative four-pane preview of X Multi Workspace](docs/images/workspace-preview.png)

*Illustrative preview with fictional accounts and posts. Your workspaces show the official X website.*

## What you can do

- Keep up to **10 account workspaces** and view 1, 2, 4, 6, or 10 screens at once, or use tabs.
- Give each workspace a name and color, then jump between them from the sidebar or with Ctrl+1–9 (Ctrl+0 for the tenth).
- Drag sidebar items to reorder them, or drag one screen's top bar onto another to swap their positions. The order persists after restarting.
- Open Home, Notifications, Profile, or Compose in any workspace. Post and attach media manually in X.
- Maximize a screen when you need room; suspend a workspace when you want to free memory.
- Use the app in English or Japanese. X's own language follows your X settings.
- Check for updates on demand. If a new release is available, open its GitHub download page.

## Start using it

1. Download and launch the [installer or portable app](https://github.com/devtk-core/x-multi-workspace/releases/latest).
2. Add a workspace and sign in through the X page it opens. Add more workspaces for other accounts.
3. Choose a layout at the top of the window.

Each workspace has separate browser storage, and valid X sessions can persist after restarting the app. X login and posts are always handled in the official website. The app uses neither the X API nor its own server. It contacts GitHub only when you click Check for updates. While the repository is private, sign in to GitHub to view its releases.

**Memory:** Each loaded X screen is a Chromium view, much like an open browser tab. In one eight-screen test, the whole app used about 1.4 GB; usage varies with images, video, and browsing. Suspending a workspace can free memory, but unsent text in that view may be lost.

For setup, builds, security details, known limitations, and suggested checks, see the [technical guide](docs/TECHNICAL.md).
