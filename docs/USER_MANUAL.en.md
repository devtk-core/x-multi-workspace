# Xnarabi User Manual

English | [日本語](USER_MANUAL.ja.md)

Xnarabi is a free Windows app for using multiple X accounts side by side in one window. You can create up to 10 workspaces, each displaying the official X website. **Xnarabi is unofficial and is not affiliated with or endorsed by X or X Corp.**

For development and build instructions, see the [technical guide](TECHNICAL.md).

## Contents

- [Download and installation](#download-and-installation)
- [Getting started](#getting-started)
- [Interface and basic controls](#interface-and-basic-controls)
- [Managing workspaces](#managing-workspaces)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Security and limitations](#security-and-limitations)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)

## Download and installation

Xnarabi supports **Windows 11 x64**. An internet connection is required to browse and sign in to X.

1. Open the [latest GitHub release](https://github.com/devtk-core/xnarabi/releases/latest).
2. Under Assets, select the installer (`Xnarabi-Setup-VERSION-x64.exe`) or portable executable (`Xnarabi-Portable-VERSION-x64.exe`).
3. For the installer, run the executable and follow the instructions. For the portable version, place the executable wherever you prefer and launch it.

The executables are currently unsigned. Windows may show an unknown publisher or SmartScreen warning. Verify that the download comes from the official release page before running it. The published `SHA256SUMS.txt` helps verify that the file matches the distributed release; a matching checksum does not by itself guarantee safety.

## Getting started

1. Launch Xnarabi and click **Add workspace** or the **+** button in the sidebar.
2. Enter a **Display name**. Optionally configure the **X handle** (without @), **Color**, and **Browser zoom**.
3. Click **Save**, then sign in manually on the official X website displayed in the workspace. Xnarabi has no separate password entry screen.
4. To use another account, add another workspace and sign in there. Each workspace has separate browser storage, including cookies.

Valid X sessions can persist when you restart the app. If X logs you out or your session expires, sign in again.

## Interface and basic controls

The sidebar shows each workspace's name, X handle, color, and status: **Visible**, **Idle**, or **Suspended**. Click a workspace to select it. Use the arrow in the upper-left corner to collapse the sidebar.

Choose **Single**, **2 panes**, **4 panes**, **6 panes**, **10 panes**, or **Tabs** at the top of the window. Split layouts show the group containing the selected workspace. For example, selecting workspace 7 in the 6-pane layout switches to the next group. Each X view loads when first displayed.

Hover over a toolbar button to see its name.

| Control | Description |
| --- | --- |
| Back / Forward | Navigate through that workspace's browsing history. |
| Home / Notifications | Open the corresponding X page. |
| Profile | Open the configured handle's profile, or X's profile settings if no handle is configured. |
| Compose | Open X's post composer. Submit posts manually on X. |
| Reload | Reload the X page. |
| Maximize | Temporarily enlarge a workspace. Use Restore layout or Esc to return. |
| ⋯ (Settings) | Open Workspace settings. |

Attach images and videos, copy and paste text, and submit posts directly on the official X website. X's interface and features may change.

Drag sidebar items to reorder workspaces. In a split layout, drag one view's top bar onto another to swap their positions. Both actions change the workspace order.

| Shortcut | Action |
| --- | --- |
| Ctrl+1 through Ctrl+9 | Select workspaces 1–9 in sidebar order. |
| Ctrl+0 | Select workspace 10. |
| Ctrl+R | Reload the selected workspace. |
| Ctrl+Shift+P | Open Compose in the selected workspace. |
| Esc | Exit maximized view. |

Use the **EN / 日本語** button at the upper right to switch the app language. The X website follows your X language settings.

## Managing workspaces

- **Add:** Click **+** in the sidebar. You can register up to 10 workspaces.
- **Edit:** Click **⋯** in the workspace toolbar, change the Display name, X handle, Color or Browser zoom, and click **Save**. Zoom ranges from 50% to 200%. Use **Move up** or **Move down** to change the order.
- **Suspend:** Click **Suspend** in Workspace settings and confirm. This closes the embedded browser to reduce memory usage. **Unsubmitted posts and form input may be lost.** Save or submit your work first. Click **Resume** to reload X. Stored session data is retained, but expired sessions require signing in again.
- **Delete:** Click **Delete** in Workspace settings. Confirm removal, then choose whether to delete the workspace's cookies and other session data. **Cancel on the second prompt removes only the workspace and retains the data.** OK also clears its cookies and local storage. Removed workspaces cannot be restored through the app, and retained data is not automatically inherited by new workspaces.

Previously loaded views may remain in memory when switching layouts or workspaces so that their pages are preserved. As a rough guide, each X view uses about 100–200 MB; eight visible views used approximately 1.4 GB for the whole app in one test. Actual usage varies with content and video. Suspend unused workspaces after saving drafts to reduce memory use.

## Updating

Xnarabi **does not update automatically**. Click **Check for updates** at the top of the window to retrieve public GitHub release information. If a new version is available, select **Open GitHub Releases** and download the executable manually. You can also visit the release page directly if the check fails.

- **Installer:** Close Xnarabi and run the new installer over the existing installation. Workspace and session data are stored separately from the application.
- **Portable:** Close Xnarabi, download and launch the new portable executable, and delete the old executable when no longer needed. Settings and session data are stored separately in your Windows user data directory.

## Uninstalling

- **Installer:** Close Xnarabi, open Windows Settings > Apps > Installed apps, find Xnarabi and uninstall it.
- **Portable:** Close Xnarabi and delete the downloaded executable.

Settings and X session data may remain in your Windows user profile. **Only if you want to remove all data**, close Xnarabi, enter `%APPDATA%\x-multi-workspace` in File Explorer's address bar, and delete that folder. **This permanently deletes all workspace settings and stored login sessions.** The folder name differs from the app name but is its current storage location.

## Security and limitations

- Each workspace displays the official X website. Xnarabi uses neither the X API nor its own server and has no automated posting feature. It does not separately collect or store passwords or authentication tokens. Sign in directly on X.
- Browser storage is isolated per workspace. Cookies and other data are stored under your Windows user profile. Protect your Windows account, especially on shared computers.
- Non-X links open in your regular browser. X pop-ups are handled in the same workspace. External authentication and features depending on pop-up windows may not work.
- Xnarabi does not grant camera, microphone or screen-sharing permissions. This may affect features such as X Spaces. Attach images and videos manually on X.
- Xnarabi does not bypass X restrictions, authentication requirements or CAPTCHA. Changes to X may affect toolbar functionality.
- More visible views consume more memory. On small displays, the 10-pane layout may cause X to use its mobile interface or make controls difficult to use.

## FAQ

**How many accounts can I use?**

Up to 10 workspaces. Sign in to each using the official X website.

**Will restarting the app log me out?**

Valid X sessions can persist using stored cookies and other browser data. Sign in again if X invalidates the session.

**Can I carry my settings with the portable executable?**

No. The current portable version stores settings and session data in the Windows user profile on that computer. Copying only the executable to another PC does not transfer login sessions.

**Why does Profile open a different page?**

Check the X handle in Workspace settings. If no handle is configured, Profile opens X's profile settings. If the configured handle differs from the signed-in account, it opens the configured handle's profile.

**How is suspending different from closing the app?**

Suspending closes the selected workspace's browser view and reloads it on Resume. Cookies and other stored session data remain, but unsubmitted posts may be lost.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| X does not load | Check your connection and click Reload. If suspended, click Resume. Check for X outages or authentication prompts. |
| Login session is lost | Check that you are using the same Windows user profile. X may have expired the session, logged you out, or session data may have been deleted when removing a workspace. |
| Update check fails | Check your connection and retry later, or visit [GitHub Releases](https://github.com/devtk-core/xnarabi/releases) directly. |
| High memory usage | Save drafts and suspend unused workspaces. Smaller layouts alone may not immediately release memory from loaded views. |
| External authentication or calls fail | Features requiring external authentication pop-ups, camera, microphone or screen sharing may be unsupported. Use X in a regular browser if needed. |
| Windows shows a warning | The executables are unsigned. Verify the filename, download source and published checksum. Inbound firewall access is not normally required to browse or post on X. |

If the issue persists, report it on [GitHub Issues](https://github.com/devtk-core/xnarabi/issues) with your app version, Windows version, steps to reproduce and any error messages. **Do not include passwords, authentication codes, cookies or unpublished drafts.**
