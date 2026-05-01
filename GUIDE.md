# Luckit — Hướng dẫn phát triển

App desktop widget cho Windows, build bằng **Tauri 2.x** (Rust) + **React + TypeScript + SCSS**.  
Unofficial client cho Locket — hiển thị moment của bạn bè dưới dạng widget cố định góc trái dưới màn hình.

---

## Mục lục

1. [Cài đặt môi trường](#1-cài-đặt-môi-trường)
2. [Chạy môi trường dev](#2-chạy-môi-trường-dev)
3. [Cấu trúc project](#3-cấu-trúc-project)
4. [Chỉnh giao diện](#4-chỉnh-giao-diện)
5. [Chỉnh API](#5-chỉnh-api)
6. [Tính năng Tauri (Rust)](#6-tính-năng-tauri-rust)
7. [Build & đóng gói](#7-build--đóng-gói)

---

## 1. Cài đặt môi trường

**Yêu cầu:**
- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Rust](https://rustup.rs) — cài qua rustup, toolchain `stable`
- Visual Studio C++ Build Tools (chọn **Desktop development with C++**)

**Cài dependencies:**

```bash
pnpm install
```

---

## 2. Chạy môi trường dev

```bash
pnpm tauri:dev
```

Widget mở ra ở góc trái dưới màn hình. Mọi thay đổi trong `src/` sẽ **hot-reload** ngay — không cần restart.

> Lần đầu Rust compile ~200 crate, mất 2–5 phút. Lần sau chỉ vài giây.

---

## 3. Cấu trúc project

```
luckit/
├── src/
│   ├── index.scss              ← Style global (màu, font, btn, input, error bar)
│   ├── main.tsx                ← Entry point React
│   ├── Popup.tsx               ← Root component
│   ├── MainContext.ts          ← Global state (loggedIn, moments, userData)
│   ├── const.ts                ← VERSION
│   ├── screens/
│   │   ├── Login.tsx           ← Màn hình đăng nhập
│   │   ├── Global.tsx          ← Layout chính: menu 3 chấm, điều hướng section
│   │   ├── Main.tsx            ← Feed moments (ảnh/video + caption + user info)
│   │   ├── Uploader.tsx        ← Upload ảnh lên Locket
│   │   ├── SavedMoments.tsx    ← Gallery moments đã lưu
│   │   └── About.tsx           ← Màn hình giới thiệu
│   ├── components/
│   │   ├── Spinner.tsx
│   │   ├── Logo.tsx
│   │   └── PhoneNumber.tsx
│   ├── services/
│   │   └── api.ts              ← HTTP calls đến Firebase & Locket API
│   ├── lib/
│   │   ├── store.ts            ← Tauri Store wrapper (persistent storage)
│   │   └── momentService.ts    ← Background polling, notification, autostart handler
│   ├── types/
│   │   ├── auth.ts
│   │   ├── moments.ts
│   │   └── user.ts
│   └── utils/
│       └── string.ts
├── src-tauri/
│   ├── tauri.conf.json         ← Cấu hình cửa sổ & app
│   ├── Cargo.toml              ← Dependencies Rust
│   ├── capabilities/
│   │   └── default.json        ← Permissions cho plugin
│   └── src/
│       └── lib.rs              ← Rust entry: tray, window position, autostart
└── dist/                       ← Frontend build output (auto-generated)
```

---

## 4. Chỉnh giao diện

### 4.1 Màu sắc & font

Mở `src/index.scss`, phần `:root`:

```scss
:root {
    --accent: #C773AF;   /* màu chủ đạo — nút, highlight */
    --color:  #dadada;   /* màu chữ chính */
}
```

**Font đang dùng:**
- **Inter** — body text
- **Manrope** — heading, nút

### 4.2 Kích thước widget

Kích thước hiện tại: **370 × 440 px**. Muốn đổi, sửa **cả hai chỗ**:

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

### 4.3 Cấu hình cửa sổ

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

- `decorations: false` — không có titlebar Windows
- `transparent: false` — không trong suốt (transparent=true trên Windows khiến click-through bị lỗi)
- `alwaysOnTop: true` — mặc định bật; có thể toggle qua system tray
- Vị trí cửa sổ do Rust tự đặt (góc trái dưới) — không set x/y ở đây

### 4.4 Thêm menu item vào menu 3 chấm

Mở `src/screens/Global.tsx`, tìm khối `<Menu>` và thêm `<MenuItem>`:

```tsx
<MenuItem onClick={() => { /* xử lý */ }} className={menuItemClassName}>
    <MdRefresh />
    Tên item
</MenuItem>
```

Import icon từ `react-icons` — xem tại [react-icons.github.io](https://react-icons.github.io/react-icons).

---

## 5. Chỉnh API

### 5.1 Thêm một API call mới

Mở `src/services/api.ts`, thêm vào object `API`:

```ts
export const API = {
    // ... hàm có sẵn ...

    getFriends: (token?: string) => fetchLocket<FriendsResponseType>({
        endpoint: "getFriends",
        method: "POST",
        body: { data: {} },
        token,
    }),
}
```

Hai helper:

| Hàm | Dùng cho |
|---|---|
| `fetchFirebase(...)` | Google Identity Toolkit, Firebase Auth, Securetoken |
| `fetchLocket(...)` | `api.locketcamera.com/*` |

> **Lưu ý:** Các HTTP call trong Uploader dùng `fetch` từ `@tauri-apps/plugin-http` (không phải browser fetch) để bypass CORS của WebView2. Nếu thêm call ra domain mới trong Uploader, kiểm tra `src-tauri/capabilities/default.json` → scope `http:default`.

### 5.2 Đọc/ghi dữ liệu lưu trữ

Dùng `src/lib/store.ts`:

```ts
import { storeGet, storeSet, storeDelete } from '../lib/store'

const token = await storeGet<string>('token')
await storeSet('token', 'abc123')
await storeDelete('token')
```

**Các key đang dùng:**

| Key | Kiểu | Nội dung |
|---|---|---|
| `token` | `string` | Firebase ID token (hết hạn sau 1h) |
| `refreshToken` | `string` | Firebase refresh token |
| `user` | `UserType` | Thông tin tài khoản |
| `moments` | `SavedMomentType[]` | Danh sách moments đã lưu |
| `lastMD5` | `string` | MD5 của moment mới nhất (tránh duplicate) |

File lưu tại: `%APPDATA%\com.locket.widget\locket-widget.json`

### 5.3 Polling & notification

`src/lib/momentService.ts` poll API mỗi **25 giây**. Khi phát hiện moment mới:
1. Lưu vào store
2. Gửi **system notification** (tên user + caption)
3. Click vào notification → app tự hiện ra

```ts
import { startMomentPolling, stopMomentPolling, onNewMoment } from '../lib/momentService'

startMomentPolling()   // gọi khi đăng nhập
stopMomentPolling()    // gọi khi logout

// Lắng nghe moment mới từ component
const unsub = onNewMoment((moments) => { ... })
return unsub  // cleanup khi unmount
```

Đổi tần suất polling (dòng cuối trong `momentService.ts`):
```ts
loopTimer = setTimeout(loop, 25_000)  // ← đổi số này
```

### 5.4 Upload ảnh — luồng

Logic trong `src/screens/Uploader.tsx`, hàm `handleUploadImage`:

```
1. Refresh token
        ↓
2. POST Firebase Storage → lấy X-Goog-Upload-URL    [lỗi → [2]]
        ↓
3. PUT file lên upload URL                           [lỗi → [4]]
        ↓
4. GET download token từ Firebase Storage            [lỗi → [5]/[6]]
        ↓
5. POST api.locketcamera.com/postMomentV2            [lỗi → [7]]
```

Ảnh convert sang **WebP 1020×1020** (canvas) trước khi upload. Mã lỗi `[0]`–`[7]` hiển thị trên UI để debug.

---

## 6. Tính năng Tauri (Rust)

Tất cả nằm trong `src-tauri/src/lib.rs`.

### 6.1 Vị trí cửa sổ

Rust tự tính và đặt cửa sổ ở **góc trái dưới** khi khởi động:

```rust
let y = (screen_h - win_h) as i32;
window.set_position(PhysicalPosition::new(0, y));
```

Widget không drag được — Windows transparent không nhận mouse event đúng cách, nên dùng vị trí cố định thay thế.

### 6.2 System tray

Tray icon có menu:

| Item | Loại | Chức năng |
|---|---|---|
| Show | MenuItem | Hiện cửa sổ + focus |
| Hide | MenuItem | Ẩn cửa sổ |
| Always on top | CheckMenuItem | Toggle alwaysOnTop |
| Start with Windows | CheckMenuItem | Toggle autostart (Windows registry) |
| Open data folder | MenuItem | Mở `%APPDATA%\com.locket.widget\` |
| Quit | MenuItem | Thoát app |

Click trái vào tray icon → Show cửa sổ.

### 6.3 Đóng cửa sổ

Nhấn X hoặc `Alt+F4` → **ẩn xuống tray**, không thoát hẳn. Muốn thoát thật: Tray → Quit.

### 6.4 Autostart

Dùng `tauri-plugin-autostart` — ghi vào Windows registry `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. Toggle qua tray, trạng thái ban đầu đọc từ registry.

### 6.5 Permissions (capabilities)

`src-tauri/capabilities/default.json` — thêm permission ở đây nếu plugin báo lỗi scope:

```json
{
  "identifier": "http:default",
  "allow": [{ "url": "https://**" }]
}
```

---

## 7. Build & đóng gói

### 7.1 Build production

```bash
pnpm tauri:build
```

Output:
```
src-tauri/target/release/bundle/
├── nsis/luckit_x.x.x_x64-setup.exe   ← Installer NSIS (khuyên dùng)
└── msi/luckit_x.x.x_x64_en-US.msi
```

### 7.2 Đổi version

Sửa **3 chỗ**:

```
src/const.ts                → export const VERSION = '0.2.0'
package.json                → "version": "0.2.0"
src-tauri/tauri.conf.json   → "version": "0.2.0"
```

### 7.3 Đổi icon app

```bash
pnpm tauri icon path/to/icon.png
```

File PNG vuông tối thiểu **1024×1024px**. Lệnh tự tạo toàn bộ kích thước vào `src-tauri/icons/`.

### 7.4 Chỉ build frontend

```bash
pnpm build
```

Output vào `dist/` — kiểm tra bundle size hoặc debug CSS.

---

## Ghi chú

- App này **không chính thức**, không liên kết với Locket Labs, Inc.
- Firebase AppCheck token trong `src/services/api.ts` có thể hết hạn — nếu login lỗi 403, cần cập nhật token.
- Tauri store lưu tại: `%APPDATA%\com.locket.widget\locket-widget.json`
- `transparent: false` là bắt buộc trên Windows — transparent window không nhận mouse event ở vùng trong suốt.
