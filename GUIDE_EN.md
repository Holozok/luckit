# Luckit — Developer Guide

Windows desktop widget built with **Tauri 2.x** (Rust) + **React + TypeScript + SCSS**.  
Unofficial Locket client — displays friends' moments as a widget pinned to the bottom-left of the screen.

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Running Dev Mode](#2-running-dev-mode)
3. [Project Structure](#3-project-structure)
4. [UI Customization](#4-ui-customization)
5. [API](#5-api)
6. [Tauri Features (Rust)](#6-tauri-features-rust)
7. [Build & Packaging](#7-build--packaging)

---

## 1. Environment Setup

**Requirements:**
- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Rust](https://rustup.rs) — install via rustup, `stable` toolchain
- Visual Studio C++ Build Tools (select **Desktop development with C++**)

**Install dependencies:**

```bash
pnpm install
```

---

## 2. Running Dev Mode

```bash
pnpm tauri:dev
```

The widget opens at the bottom-left of the screen. Changes in `src/` **hot-reload** instantly — no restart needed.

> First run compiles ~200 Rust crates, taking 2–5 minutes. Subsequent runs take only a few seconds.

---

## 3. Project Structure

```
luckit/
├── src/
│   ├── index.scss              ← Global styles (colors, fonts, buttons, error bar)
│   ├── main.tsx                ← React entry point
│   ├── Popup.tsx               ← Root component
│   ├── MainContext.ts          ← Global state (loggedIn, moments, userData)
│   ├── const.ts                ← VERSION
│   ├── screens/
│   │   ├── Login.tsx           ← Login screen
│   │   ├── Global.tsx          ← Main layout: 3-dot menu, section navigation
│   │   ├── Main.tsx            ← Moments feed (photo/video + caption + user info)
│   │   ├── Uploader.tsx        ← Upload photo to Locket
│   │   ├── SavedMoments.tsx    ← Saved moments gallery
│   │   └── About.tsx           ← About screen
│   ├── components/
│   │   ├── Spinner.tsx
│   │   ├── Logo.tsx
│   │   └── PhoneNumber.tsx
│   ├── services/
│   │   └── api.ts              ← HTTP calls to Firebase & Locket API
│   ├── lib/
│   │   ├── store.ts            ← Tauri Store wrapper (persistent storage)
│   │   └── momentService.ts    ← Background polling, notifications, notification click handler
│   ├── types/
│   │   ├── auth.ts
│   │   ├── moments.ts
│   │   └── user.ts
│   └── utils/
│       └── string.ts
├── src-tauri/
│   ├── tauri.conf.json         ← Window & app configuration
│   ├── Cargo.toml              ← Rust dependencies
│   ├── capabilities/
│   │   └── default.json        ← Plugin permissions
│   └── src/
│       └── lib.rs              ← Rust entry: tray, window positioning, autostart
└── dist/                       ← Frontend build output (auto-generated)
```

---

## 4. UI Customization

### 4.1 Colors & Fonts

Edit `src/index.scss`, `:root` block:

```scss
:root {
    --accent: #C773AF;   /* primary color — buttons, highlights */
    --color:  #dadada;   /* main text color */
}
```

**Fonts in use:**
- **Inter** — body text
- **Manrope** — headings, buttons

### 4.2 Widget Size

Current size: **370 × 440 px**. To change, update **both locations**:

`src/index.scss`:
```scss
body {
    width: 370px;
    height: 440px;
}
```

`src-tauri/tauri.conf.json`:
```json
"width": 370,
"height": 440
```

### 4.3 Window Configuration

`src-tauri/tauri.conf.json` → `app.windows[0]`:

```json
{
  "label": "main",
  "title": "Locket",
  "width": 370,
  "height": 440,
  "resizable": false,
  "decorations": false,
  "transparent": false,
  "alwaysOnTop": true,
  "shadow": false
}
```

- `decorations: false` — no Windows titlebar
- `transparent: false` — required on Windows; transparent windows break mouse event handling
- `alwaysOnTop: true` — on by default; toggleable via system tray
- Window position is set by Rust at startup (bottom-left) — do not set x/y here

### 4.4 Adding a Menu Item

Open `src/screens/Global.tsx`, find the `<Menu>` block and add a `<MenuItem>`:

```tsx
<MenuItem onClick={() => { /* handler */ }} className={menuItemClassName}>
    <MdRefresh />
    Item label
</MenuItem>
```

Browse icons at [react-icons.github.io](https://react-icons.github.io/react-icons).

---

## 5. API

### 5.1 Adding a New API Call

Open `src/services/api.ts`, add to the `API` object:

```ts
export const API = {
    // ... existing functions ...

    getFriends: (token?: string) => fetchLocket<FriendsResponseType>({
        endpoint: "getFriends",
        method: "POST",
        body: { data: {} },
        token,
    }),
}
```

Two helper functions:

| Function | Used for |
|---|---|
| `fetchFirebase(...)` | Google Identity Toolkit, Firebase Auth, Securetoken |
| `fetchLocket(...)` | `api.locketcamera.com/*` |

> **Note:** HTTP calls inside Uploader use `fetch` from `@tauri-apps/plugin-http` (not the browser fetch) to bypass WebView2 CORS restrictions. If you add calls to new domains in Uploader, update the `http:default` scope in `src-tauri/capabilities/default.json`.

### 5.2 Reading & Writing Persistent Data

Use `src/lib/store.ts`:

```ts
import { storeGet, storeSet, storeDelete } from '../lib/store'

const token = await storeGet<string>('token')
await storeSet('token', 'abc123')
await storeDelete('token')
```

**Keys in use:**

| Key | Type | Contents |
|---|---|---|
| `token` | `string` | Firebase ID token (expires after 1h) |
| `refreshToken` | `string` | Firebase refresh token |
| `user` | `UserType` | Account information |
| `moments` | `SavedMomentType[]` | Saved moments list |
| `lastMD5` | `string` | MD5 of latest moment (deduplication) |

Data file location: `%APPDATA%\com.locket.widget\locket-widget.json`

### 5.3 Polling & Notifications

`src/lib/momentService.ts` polls the API every **25 seconds**. When a new moment is detected:
1. Saves to store
2. Sends a **system notification** (username + caption)
3. Clicking the notification → app shows and focuses

```ts
import { startMomentPolling, stopMomentPolling, onNewMoment } from '../lib/momentService'

startMomentPolling()   // call on login
stopMomentPolling()    // call on logout

// Listen for new moments from any component
const unsub = onNewMoment((moments) => { ... })
return unsub  // cleanup on unmount
```

To change the polling interval (last line of `momentService.ts`):
```ts
loopTimer = setTimeout(loop, 25_000)  // ← change this value
```

### 5.4 Image Upload Flow

Logic in `src/screens/Uploader.tsx`, function `handleUploadImage`:

```
1. Refresh token
        ↓
2. POST Firebase Storage → get X-Goog-Upload-URL         [error → [2]]
        ↓
3. PUT file to upload URL                                 [error → [4]]
        ↓
4. GET download token from Firebase Storage               [error → [5]/[6]]
        ↓
5. POST api.locketcamera.com/postMomentV2                 [error → [7]]
```

Images are converted to **WebP 1020×1020** (via canvas) before upload. Error codes `[0]`–`[7]` are displayed in the UI for debugging.

---

## 6. Tauri Features (Rust)

Everything lives in `src-tauri/src/lib.rs`.

### 6.1 Window Positioning

Rust calculates and places the window at the **bottom-left** of the primary monitor on startup:

```rust
let y = (screen_h - win_h) as i32;
window.set_position(PhysicalPosition::new(0, y));
```

Dragging is not supported — Windows does not reliably send mouse events on non-transparent areas of a frameless window. Fixed positioning is used instead.

### 6.2 System Tray

The tray icon provides a context menu:

| Item | Type | Action |
|---|---|---|
| Show | MenuItem | Show window + focus |
| Hide | MenuItem | Hide window |
| Always on top | CheckMenuItem | Toggle `set_always_on_top` (default: on) |
| Start with Windows | CheckMenuItem | Toggle autostart via Windows registry |
| Open data folder | MenuItem | Open `%APPDATA%\com.locket.widget\` in Explorer |
| Quit | MenuItem | `app.exit(0)` |

Left-clicking the tray icon shows the window.

### 6.3 Close Button Behavior

Pressing X or `Alt+F4` **hides the window to the tray** — it does not quit. To fully quit: Tray → Quit.

### 6.4 Autostart

Uses `tauri-plugin-autostart` — writes to `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. Toggled via tray; initial state is read from the registry on startup.

### 6.5 Plugin Permissions

`src-tauri/capabilities/default.json` — add permissions here if a plugin reports a scope error:

```json
{
  "identifier": "http:default",
  "allow": [{ "url": "https://**" }]
}
```

---

## 7. Build & Packaging

### 7.1 Production Build

```bash
pnpm tauri:build
```

Output:
```
src-tauri/target/release/bundle/
├── nsis/luckit_x.x.x_x64-setup.exe   ← NSIS installer (recommended)
└── msi/luckit_x.x.x_x64_en-US.msi
```

### 7.2 Changing the Version

Update **3 places**:

```
src/const.ts                → export const VERSION = '0.2.0'
package.json                → "version": "0.2.0"
src-tauri/tauri.conf.json   → "version": "0.2.0"
```

### 7.3 Changing the App Icon

```bash
pnpm tauri icon path/to/icon.png
```

Provide a square PNG at least **1024×1024px**. The command generates all required sizes into `src-tauri/icons/`.

### 7.4 Frontend-Only Build

```bash
pnpm build
```

Output goes to `dist/` — useful for checking bundle size or debugging CSS.

---

## Notes

- This app is **unofficial** and is not affiliated with Locket Labs, Inc.
- The Firebase AppCheck token in `src/services/api.ts` may expire — if login returns 403, the token needs to be updated.
- Persistent data is stored at: `%APPDATA%\com.locket.widget\locket-widget.json`
- `transparent: false` is required on Windows — transparent windows do not receive mouse events in transparent regions, breaking all click interactions.
