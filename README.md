# luckit

`/ˈlʌkɪt/`

An unofficial Locket client — available as a **Chromium browser extension** and a **Windows desktop widget**.

[![CI status](https://github.com/michioxd/luckit/actions/workflows/test.yaml/badge.svg)](https://github.com/michioxd/luckit/actions/workflows/test.yaml)

## Disclaimer

This project is not affiliated with Locket or Locket Labs, Inc in any way. By using this software, you acknowledge that it is an unofficial Locket client, and you accept the risk that your account may be banned.

If you're unsure about this or you don't know what you are doing, please refrain from using it.

The authors won't be held responsible for any consequences.

---

## Chrome Extension

### Features

- Save moments in the background while using your browser.
- Upload images.

### Installation

[![Get it on Google Chrome Web Store](https://github.com/user-attachments/assets/2f324143-0532-45a8-aa87-b4d1afaece79)](https://chromewebstore.google.com/detail/luckit/gkpedjnafgjmkjlcfcgcjonblhjiifmo)

**Install manually:**

- Download `luckit.chromium.zip` from the [Releases page](https://github.com/michioxd/luckit/releases/latest) and extract it anywhere.
- Go to `chrome://extensions/` and enable Developer mode.
- Click "Load unpacked" and select the extracted `luckit` folder.

---

## Windows Desktop Widget

A always-on-top widget pinned to the bottom-left corner of your screen. Displays your friends' latest Locket moments, sends system notifications on new moments, and minimizes to the system tray.

### Features

- Displays friends' latest moments (photo/video + caption).
- System notification when a new moment arrives — click to open the app.
- Upload moments to Locket.
- Save moments locally.
- Always-on-top, no titlebar, fixed to bottom-left corner.
- System tray: Show / Hide / Always on top toggle / Start with Windows / Open data folder / Quit.
- Hides to tray on close — fully quits only via Tray → Quit.

### Installation

Download the installer from the [Releases page](https://github.com/Holozok/luckit/releases/latest):

```
luckit_x.x.x_x64-setup.exe   ← recommended (NSIS installer)
luckit_x.x.x_x64_en-US.msi
```

### Development

See [GUIDE.md](GUIDE.md) for the full developer guide (setup, project structure, API, Tauri/Rust features, build & packaging).

Requirements: Node.js 18+, pnpm, Rust (stable), Visual Studio C++ Build Tools.

```sh
git clone https://github.com/Holozok/luckit
cd luckit
pnpm install
pnpm tauri:dev
```

---

## Screenshots

![gtb1b2XdCk](https://github.com/user-attachments/assets/d2cb6440-f48c-41e1-8d3d-0e185801c06d)
![F4KcremqMb](https://github.com/user-attachments/assets/e4068f8e-125b-45fb-ab16-9b39857335dd)
![Zz3xrfrlpk](https://github.com/user-attachments/assets/20af0c5f-e598-494b-b284-17ba254c50b8)

## License

All code is released under the [MIT License](LICENSE).

## Credits

Made with love by [michioxd](https://github.com/michioxd) and [Holozok](https://github.com/holozok), and thanks to all [contributors](https://github.com/michioxd/luckit/graphs/contributors).
