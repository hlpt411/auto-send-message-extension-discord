<div align="center">

# ⚡ Chat Sender Pro

**Gửi tin nhắn hàng loạt trên Discord — nhanh, đẹp, kiểm soát hoàn toàn**

Nâng cấp từ *Chat Input Load Tester*: UI hiện đại hơn, chạy mượt hơn, theo dõi trạng thái theo thời gian thực, badge đếm tin ngay trên icon.

`Manifest V3` · `Web Extension` · `Made by Pt`

---

</div>

## 📑 Mục lục

1. [Tính năng](#-tính-năng)
2. [Ảnh demo](#-ảnh-demo)
3. [Cài đặt](#-cài-đặt)
4. [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
5. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
6. [Đã nâng cấp gì so với bản cũ](#-đã-nâng-cấp-gì-so-với-bản-cũ)
7. [Kết quả kiểm thử](#-kết-quả-kiểm-thử)
8. [Dành cho developer](#-dành-cho-developer)
9. [Câu hỏi thường gặp](#-câu-hỏi-thường-gặp)
10. [Lưu ý quan trọng](#-lưu-ý-quan-trọng)

---

## ✨ Tính năng

| 🚀 Tính năng | Mô tả |
|:---|:---|
| 🎨 **UI hiện đại** | Dark theme, gradient header, card glass, chips chọn tốc độ nhanh, toast thông báo mượt mà |
| 🔴 **Badge đếm tin trên icon** | Số tin đã gửi hiện ngay trên icon extension — đóng popup vẫn biết tiến độ |
| 📊 **Thống kê realtime** | Đã gửi, thời gian chạy, tốc độ (tin/phút), số tin bỏ qua, progress bar |
| 🔁 **Gửi nhiều tin xoay vòng** | Mỗi dòng trong ô tin nhắn = 1 tin, gửi luân phiên liên tục |
| 🧪 **Gửi thử 1 tin** | Kiểm tra kết nối + selector trước khi chạy hàng loạt, tránh "nổ" ngay từ đầu |
| 🛑 **Dừng tức thì** | Nút **Dừng** hoặc phím **`Esc`** — hủy ngay, *không* gửi thêm tin nào đang bay giữa chừng |
| 💾 **Tự lưu cài đặt** | Tin nhắn, khoảng cách, số lần tối đa được nhớ lại sau mỗi lần mở popup |
| 🧠 **Nhập text chuẩn Discord** | `beforeinput` + `execCommand` (React/Slate) kèm fallback native setter — tương thích mọi trường hợp |
| 🛡️ **Guard thông minh** | Không bao giờ gửi tin trống; báo lỗi rõ ràng khi thiếu ô nhập / nút gửi |
| ⚙️ **Preset tốc độ** | 0.1s – 5s chỉ bằng 1 cú chạm chip, kèm preset số lần (10 / 50 / 100 / ∞) |
| 🔌 **Quyền tối thiểu** | Chỉ `activeTab` + `scripting` + `storage` — không thu thập bất kỳ dữ liệu nào |

---

## 🖼️ Ảnh demo

> Popup hiển thị khi extension đang chạy: badge "6" trên icon, thống kê đã gửi / thời gian / tốc độ / bỏ qua.

![Chat Sender Pro đang chạy](popup-running.png)

---

## 🚀 Cài đặt

### Cách 1 — Load unpacked (khuyên dùng)

1. Giải nén thư mục `chat-sender-pro` (hoặc file `chat-sender-pro.zip`) ra máy
2. Mở Chrome và truy cập: **`chrome://extensions`**
3. Bật công tắc **Developer mode** (Chế độ nhà phát triển) ở góc trên bên phải
4. Bấm **Load unpacked** (Tải tiện ích đã giải nén)
5. Chọn thư mục `chat-sender-pro` → bấm OK
6. Ghim icon lên thanh công cụ: bấm icon mảnh ghép 🧩 → bấm icon ghim 📌 cạnh "Chat Sender Pro"

### Cách 2 — Kiểm tra nhanh (không cài)

Mở file `popup.html` trực tiếp trên trình duyệt để xem giao diện (bản demo — nút chưa hoạt động vì chưa có môi trường extension).

---

## 🎯 Hướng dẫn sử dụng

```
1. Mở Discord, vào kênh chat muốn gửi tin
2. Bấm icon Chat Sender Pro trên thanh công cụ
3. Nhập nội dung tin nhắn
   → mỗi dòng = 1 tin khác nhau, sẽ gửi xoay vòng
4. Chọn khoảng cách giữa các lần gửi (0.1s – 5s)
5. Chọn số lần tối đa (để trống = không giới hạn ∞)
6. Bấm "Gửi thử" → thấy toast "Đã gửi 1 tin thử thành công" là chuẩn
7. Bấm "▶ Bắt đầu"
8. Theo dõi: số tin tăng dần + badge đỏ đếm trên icon
9. Muốn dừng: bấm "■ Dừng" hoặc nhấn phím Esc
```

> 💡 **Mẹo:** Đóng popup **không** làm dừng quá trình — extension chạy ngầm và badge vẫn đếm. Mở lại popup bất cứ lúc nào để xem thống kê và dừng.

---

## 📁 Cấu trúc thư mục

```
chat-sender-pro/
├── manifest.json      # Khai báo extension (Manifest V3)
├── background.js      # Service worker: badge đếm tin trên icon
├── content.js         # Tiêm vào trang Discord: vòng lặp gửi tin
├── popup.html         # Giao diện popup (dark theme hiện đại)
├── popup.js           # Logic popup: kết nối, điều khiển, thống kê
├── icons/
│   ├── icon16.png     # Icon kích thước 16px
│   ├── icon48.png     # Icon 48px
│   └── icon128.png    # Icon 128px
├── popup-running.png  # Ảnh demo UI lúc đang chạy
└── README.md          # Tài liệu này
```

---

## 🔄 Đã nâng cấp gì so với bản cũ

### 🐛 Sửa bug
| Bug cũ | Cách xử lý |
|:---|:---|
| Bấm Dừng vẫn gửi thêm 1 tin "đang bay" | Kiểm tra token trước khi bấm gửi → hủy ngay, không gửi thêm |
| Có thể bấm gửi tin trống | Lọc dòng rỗng trước khi gửi, đếm riêng số lần bỏ qua |
| Không biết tại sao không gửi được | Báo lỗi cụ thể trên popup: thiếu ô nhập, thiếu nút gửi, chen text lỗi |

### ✨ Tính năng mới
- Badge đếm tin trên icon extension (cần service worker `background.js`)
- Gửi nhiều tin xoay vòng (1 dòng = 1 tin)
- Nút "Gửi thử 1 tin" kiểm tra kết nối trước
- Thống kê realtime: đã gửi / thời gian / tin-phút / bỏ qua / progress bar
- Lưu cài đặt tự động (`chrome.storage.local`)
- Phím `Esc` dừng khẩn cấp, toast thông báo, chips preset tốc độ
- UI làm lại hoàn toàn: dark theme, gradient, icon riêng, bố cục rõ ràng

---

## ✅ Kết quả kiểm thử

Toàn bộ đều được chạy test thật trên Chromium trước khi bàn giao:

| Hạng mục | Kết quả |
|:---|:---:|
| Logic gửi xoay vòng nhiều dòng, đúng thứ tự | ✅ 11/11 PASS |
| Đếm số tin chính xác theo `maxIterations` | ✅ PASS |
| Bỏ qua tin trống, không gửi tin rỗng | ✅ PASS |
| STOP dừng loop tức thì, không gửi thêm | ✅ PASS |
| E2E nạp extension thật vào Chromium (badge, SW, popup) | ✅ 6/6 PASS |
| Full-flow: popup → tiêm script → gửi 6 tin → badge "6" → dừng | ✅ 8/8 PASS |

---

## 🧑‍💻 Dành cho developer

### Lệnh nội bộ (content script — `chrome.tabs.sendMessage`)

| Action | Payload | Mô tả |
|:---|:---|:---|
| `START` | `{ message, delay, maxIterations }` | Bắt đầu vòng lặp gửi tin |
| `STOP` | — | Dừng vòng lặp ngay lập tức |
| `SEND_ONE` | `{ message }` | Gửi thử 1 tin |
| `STATUS` | — | Lấy trạng thái hiện tại |
| `PING` | — | Kiểm tra script đã được tiêm chưa |

### Trạng thái trả về (`STATUS`)
```json
{
  "injected": true,
  "running": false,
  "count": 12,
  "skipped": 1,
  "delay": 1000,
  "maxIterations": 50,
  "elapsed": 15200,
  "lastError": null,
  "inputFound": true,
  "submitFound": true
}
```

### Selector Discord (có thể tùy chỉnh trong `content.js`)
```js
const INPUT_SELECTOR  = '[class*="channelTextArea"] [role="textbox"]';
const SUBMIT_SELECTOR = '[class*="channelTextArea"] button[aria-label="Send Message"]';
```

---

## ❓ Câu hỏi thường gặp

**Q: Bấm Bắt đầu mà không có gì xảy ra?**
→ Bạn đang mở đúng tab Discord chưa? Kiểm tra hàng "Ô nhập / Nút gửi" hiển thị **Có** ở popup. Bấm **Gửi thử** trước để chắc chắn.

**Q: Đóng popup có dừng không?**
→ Không. Extension chạy ngầm, badge trên icon vẫn đếm. Mở lại popup để dừng.

**Q: Có gửi được cho Messenger / web chat khác không?**
→ Bản này tối ưu cho Discord. Để hỗ trợ trang khác, chỉnh 2 selector ở đầu `content.js`.

**Q: Gửi nhanh quá có sao không?**
→ Discord có rate-limit; gửi quá nhanh (dưới ~300ms) và vô hạn dễ bị khóa tạm thời. Extension cảnh báo khi bạn chọn chạy vô hạn ở tốc độ cao.

---

## ⚠️ Lưu ý quan trọng

- 🛡️ Chỉ sử dụng cho mục đích hợp pháp: kiểm thử bot, gửi thông báo hàng loạt cho kênh/nhóm bạn quản lý, thử nghiệm tự động hóa...
- 🚫 Spam quá mức có thể dẫn đến **rate-limit hoặc khóa tài khoản Discord** — hãy dùng khoảng cách ≥ 1s và có chọn lọc.
- 🔒 Extension sử dụng quyền tối thiểu, không thu thập dữ liệu, không gửi dữ liệu đi đâu.

---

<div align="center">

**Chat Sender Pro** — v2.0.0

© 2026 **Made by Pt** · Gửi tin thông minh, an toàn, đẹp mắt ⚡

</div>
