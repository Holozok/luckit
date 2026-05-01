[English 🇺🇸](README.md) | **Tiếng Việt 🇻🇳**

# luckit

`/ˈlʌkɪt/`

Client không chính thức cho Locket — có sẵn dưới dạng **tiện ích mở rộng cho trình duyệt Chromium** và **widget desktop Windows**.

[![CI status](https://github.com/michioxd/luckit/actions/workflows/test.yaml/badge.svg)](https://github.com/michioxd/luckit/actions/workflows/test.yaml)

## Miễn trừ trách nhiệm

Tiện ích này không phải, hay không liên kết gì với Locket hoặc Locket Labs, Inc. Bằng cách sử dụng phần mềm này, bạn chấp nhận rằng đây là một client không chính thức cho Locket, và bạn chấp nhận rủi ro tài khoản của bạn có thể bị ban bất cứ lúc nào.

Nếu bạn không hài lòng với điều trên, hoặc bạn không biết mình đang làm gì, vui lòng không sử dụng phần mềm này.

Các tác giả sẽ không chịu trách nhiệm về bất kỳ hậu quả nào.

---

## Tiện ích mở rộng Chrome

### Tính năng

- Lưu lại những khoảnh khắc trong nền khi bạn đang sử dụng trình duyệt.
- Tải ảnh lên.

### Cài đặt

[![Get it on Google Chrome Web Store](https://github.com/user-attachments/assets/2f324143-0532-45a8-aa87-b4d1afaece79)](https://chromewebstore.google.com/detail/luckit/gkpedjnafgjmkjlcfcgcjonblhjiifmo)

**Cài đặt thủ công:**

- Tải `luckit.chromium.zip` từ [Trang phát hành](https://github.com/michioxd/luckit/releases/latest) sau đó giải nén ở bất kỳ đâu bạn muốn.
- Mở trang `chrome://extensions/` sau đó bật Chế độ dành cho nhà phát triển.
- Nhấn vào "Tải tiện ích đã giải nén", chọn thư mục `luckit` bạn vừa giải nén.

---

## Widget Desktop Windows

Widget luôn hiển thị trên cùng, cố định ở góc trái dưới màn hình. Hiển thị moment mới nhất của bạn bè, gửi thông báo hệ thống khi có moment mới, và thu nhỏ xuống system tray.

### Tính năng

- Hiển thị moment mới nhất của bạn bè (ảnh/video + caption).
- Thông báo hệ thống khi có moment mới — click vào thông báo để mở app.
- Tải ảnh lên Locket.
- Lưu moment về máy.
- Luôn hiển thị trên cùng, không có titlebar, cố định góc trái dưới.
- System tray: Show / Hide / Always on top / Start with Windows / Open data folder / Quit.
- Nhấn X → ẩn xuống tray, không thoát hẳn — chỉ thoát thật qua Tray → Quit.

### Cài đặt

Tải installer từ [Trang phát hành](https://github.com/michioxd/luckit/releases/latest):

```
luckit_x.x.x_x64-setup.exe   ← khuyên dùng (NSIS installer)
luckit_x.x.x_x64_en-US.msi
```

### Phát triển

Xem [GUIDE.md](GUIDE.md) để biết hướng dẫn chi tiết (cài đặt môi trường, cấu trúc project, API, Tauri/Rust, build & đóng gói).

Yêu cầu: Node.js 18+, pnpm, Rust (stable), Visual Studio C++ Build Tools.

```sh
git clone https://github.com/michioxd/luckit
cd luckit
pnpm install
pnpm tauri:dev
```

---

## Ảnh chụp màn hình

![gtb1b2XdCk](https://github.com/user-attachments/assets/d2cb6440-f48c-41e1-8d3d-0e185801c06d)
![F4KcremqMb](https://github.com/user-attachments/assets/e4068f8e-125b-45fb-ab16-9b39857335dd)
![Zz3xrfrlpk](https://github.com/user-attachments/assets/20af0c5f-e598-494b-b284-17ba254c50b8)

## Giấy phép

Phát hành theo giấy phép [MIT License](LICENSE).

## Credits

Made with love by [michioxd](https://github.com/michioxd) and [Holozok](https://github.com/holozok), and thanks to all [contributors](https://github.com/michioxd/luckit/graphs/contributors).
