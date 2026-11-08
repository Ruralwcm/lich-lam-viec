# Lịch Làm Việc - Khai Báo & Dashboard

Web app cho AC (Assistant) GĐV & GĐM Rural team khai báo lịch làm việc theo tuần.

## 🚀 Triển khai nhanh

### Bước 1: Tạo Google Sheet & GAS

1. Vào [Google Sheets](https://sheets.google.com), tạo sheet mới tên **LichLamViec**
2. Vào menu **Tiện ích → Apps Script**
3. Xóa code mặc định, paste toàn bộ nội dung `Code.gs` vào
4. **Chạy hàm `testSyncStorelist`** một lần để đồng bộ danh sách cửa hàng:
   - Chọn `testSyncStorelist` trong dropdown hàm → nhấn ▶️ Run
   - Cấp quyền truy cập khi được hỏi
5. Deploy web app:
   - **Deploy → New deployment**
   - Chọn loại: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (hoặc Anyone with Google account)
   - Nhấn **Deploy** → Copy URL (`https://script.google.com/macros/s/.../exec`)

### Bước 2: Cấu hình GAS_URL

Mở `index.html`, tìm dòng:
```js
var GAS_URL = '';
```
Thay bằng URL web app vừa copy:
```js
var GAS_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';
```

### Bước 3: Deploy lên GitHub Pages

```bash
# Clone repo (tạo mới nếu chưa có)
git clone git@github.com:Ruralwcm/lich-lam-viec.git
cd lich-lam-viec

# Copy files
cp /path/to/output/lich-lam-viec/index.html .
cp /path/to/output/lich-lam-viec/README.md .

# Commit & push
git add .
git commit -m "Initial deploy: Lịch làm việc v1.0"
git push origin main
```

Vào **Settings → Pages** của repo, chọn branch `main`, thư mục `/ (root)`, Save.

Trang sẽ được deploy tại: `https://Ruralwcm.github.io/lich-lam-viec/`

Hoặc dùng script tự động:
```bash
bash deploy.sh
```

## 📁 Cấu trúc file

| File | Mô tả |
|------|-------|
| `Code.gs` | Google Apps Script backend (doGet, doPost, CRUD, sync storelist) |
| `index.html` | Single-page web app (form khai báo + dashboard) |
| `README.md` | Hướng dẫn triển khai |
| `deploy.sh` | Script tự động deploy lên GitHub Pages |

## 📊 Data Model (Google Sheets)

Sheet: **LichLamViec**

### Tab "Data" - Lưu task records
| Cột | Field | Mô tả |
|-----|-------|-------|
| A | id | Unique task ID (UUID) |
| B | ho_ten | Họ tên người khai báo |
| C | vai_tro | GĐV hoặc GĐM |
| D | thang | Tháng (1-12) |
| E | tuan | Số tuần trong tháng |
| F | ngay | T2, T3, T4, T5, T6, T7, CN |
| G | task_type | Loại công việc |
| H | task_custom | Mô tả nếu chọn "Khác" |
| I | ma_ch | Mã SAP cửa hàng |
| J | ten_ch | Tên cửa hàng |
| K | ghi_chu | Ghi chú |
| L | created_at | Thời gian tạo |
| M | updated_at | Thời gian cập nhật |

### Tab "Storelist_Ref" - Danh sách CH
Đồng bộ tự động từ sheet nguồn (ID: `1fMmEm1GC9aei_3oeu2vcadPVsUM9ms9eVhm99d7pF8A`, tab `Store_list`)

## 🔧 API Endpoints (GAS doPost)

Tất cả gọi POST đến `GAS_URL`:

| Action | Body | Mô tả |
|--------|------|-------|
| `getSchedule` | `{ho_ten?, vai_tro?, thang?, tuan?}` | Lấy danh sách task |
| `saveSchedule` | `{tasks: [...]}` | Lưu toàn bộ lịch tuần |
| `updateTask` | `{id, task_type?, ...}` | Cập nhật 1 task |
| `deleteTask` | `{id}` | Xóa 1 task |
| `getStorelist` | `{search?}` | Tìm kiếm cửa hàng |

## 🎨 Design

- **Màu WinMart**: Primary Red `#C00000`, Gradient `#E8213D → #B30F2B → #6E0517`
- **Mobile-first**: Responsive, tối ưu cho điện thoại
- **Tiếng Việt**: Toàn bộ UI bằng tiếng Việt

## 📝 Ghi chú

- Storelist có ~2,915 CH, search được hỗ trợ server-side qua GAS
- Dashboard hỗ trợ 2 chế độ xem: Timeline & Bảng
- Export CSV hỗ trợ UTF-8 BOM để mở đúng tiếng Việt trong Excel