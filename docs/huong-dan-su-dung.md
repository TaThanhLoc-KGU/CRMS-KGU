# Hướng dẫn sử dụng — CRMS-KGU (Trang quản trị)

Tài liệu này dành cho **cán bộ Phòng Quản trị Cơ sở Vật chất** (vai trò Admin/Officer)
sử dụng trang quản trị của hệ thống Quản lý Phòng, Trung tâm Hội nghị Trường Đại học
Kiên Giang. Không cần biết lập trình để đọc tài liệu này.

> **Phạm vi hiện tại (P0):** hệ thống mới có phần *quản lý phòng và tài sản trong
> phòng*. Trang công khai cho các đơn vị đăng ký mượn phòng, duyệt đơn, in phiếu mượn/
> trả, gửi email, v.v. sẽ có ở các bản cập nhật tiếp theo (xem mục "Sắp có" ở cuối tài
> liệu).

---

## 1. Truy cập hệ thống

Mở trình duyệt (Chrome, Edge, Firefox đều được — kể cả trên điện thoại/máy tính bảng)
và vào địa chỉ do quản trị viên cung cấp, ví dụ:

- Nếu chạy trên máy chủ nội bộ: `http://<địa-chỉ-máy-chủ>:8092`
- Nếu chạy thử trên máy cá nhân: `http://localhost:8092`

## 2. Đăng nhập

1. Nhập **Tên đăng nhập** và **Mật khẩu**.
2. Bấm **Đăng nhập**.

Tài khoản mặc định khi mới cài đặt: `admin` / `Admin@123`.

> ⚠️ **Đổi mật khẩu này ngay** nếu hệ thống đang chạy thật (không chỉ để dùng thử) —
> hỏi quản trị viên kỹ thuật cách đổi, vì màn hình đổi mật khẩu tự phục vụ chưa có ở
> bản này.

Nếu nhập sai tên đăng nhập hoặc mật khẩu, hệ thống báo lỗi màu đỏ ngay trên form —
kiểm tra lại và thử lại.

Đăng nhập thành công sẽ tự chuyển vào màn hình **Quản lý phòng**.

## 3. Màn hình Quản lý phòng

Đây là màn hình chính, hiển thị bảng danh sách tất cả các phòng của Trung tâm Hội
nghị, gồm các cột:

| Cột | Ý nghĩa |
|---|---|
| Mã phòng | Mã viết tắt để nhận diện nhanh (VD: `TT-TAM`) |
| Tên phòng | Tên đầy đủ |
| Tòa nhà | Tên tòa nhà |
| Tầng | Số tầng |
| Sức chứa | Số người tối đa |
| Trạng thái | **Hoạt động** (màu xanh) / **Bảo trì** (màu cam) / **Ngừng sử dụng** (màu đỏ) |
| Thao tác | Các nút hành động cho từng phòng |

**Tìm phòng nhanh:** gõ vào ô tìm kiếm phía trên bên phải (tìm theo mã hoặc tên
phòng), nhấn Enter hoặc bấm biểu tượng kính lúp.

### 3.1. Thêm phòng mới

1. Bấm nút **+ Thêm phòng** (góc trên bên phải).
2. Điền thông tin:
   - **Mã phòng** *(bắt buộc)* — không được trùng với phòng đã có.
   - **Tên phòng** *(bắt buộc)*.
   - Tòa nhà, Tầng, Sức chứa, Diện tích, Mô tả, URL ảnh đại diện — điền nếu có.
   - **Trạng thái** — mặc định "Hoạt động".
3. Bấm **Lưu** (nút xanh trong hộp thoại). Hệ thống báo "Đã thêm phòng" và phòng mới
   xuất hiện ngay trong danh sách.

Nếu mã phòng đã tồn tại, hệ thống báo lỗi và không lưu — đổi sang mã khác rồi thử lại.

### 3.2. Sửa thông tin phòng

1. Ở dòng phòng cần sửa, bấm biểu tượng **bút chì** (cột Thao tác).
2. Hộp thoại hiện ra với **toàn bộ thông tin hiện có của phòng** đã được điền sẵn.
3. Sửa các trường cần đổi, bấm **Lưu**.

> **Lưu ý kỹ thuật nhỏ:** khi lưu, hệ thống ghi đè toàn bộ thông tin phòng bằng đúng
> những gì đang hiển thị trên form — vì vậy đừng xóa trắng một trường nếu không có ý
> định xóa dữ liệu đó (form đã tự điền sẵn đầy đủ nên bình thường sẽ không gặp vấn đề
> này, chỉ cần chú ý nếu vô tình xóa nhầm nội dung một ô nào đó trước khi lưu).

### 3.3. Xóa phòng

1. Bấm biểu tượng **thùng rác** (màu đỏ) ở dòng phòng cần xóa.
2. Hộp xác nhận hiện ra — bấm **Xóa** để xác nhận, hoặc **Hủy** nếu bấm nhầm.

> ⚠️ Xóa phòng là thao tác khó hoàn tác. Cân nhắc đổi **Trạng thái** sang "Ngừng sử
> dụng" thay vì xóa hẳn, nếu chỉ muốn tạm ẩn phòng khỏi vận hành mà vẫn giữ lại dữ
> liệu/lịch sử.

## 4. Quản lý tài sản trong phòng

Mỗi phòng có một danh sách trang thiết bị/tài sản riêng (bàn ghế, máy chiếu, âm
thanh...) dùng để đối chiếu khi lập phiếu mượn/trả sau này.

1. Từ danh sách phòng, bấm nút **Quản lý tài sản** ở dòng phòng cần xem.
2. Màn hình chi tiết hiện ra: thông tin phòng ở trên, bảng tài sản ở dưới.

### 4.1. Thêm tài sản

1. Bấm **+ Thêm tài sản**.
2. Điền:
   - **Mã tài sản** *(bắt buộc, không trùng)*, **Tên tài sản** *(bắt buộc)*.
   - Danh mục, Số lượng, Đơn vị tính (cái/bộ/chiếc...), Năm mua, Ghi chú — nếu có.
   - **Tình trạng**: Tốt / Bình thường / Hư hỏng.
   - **Di động / dùng chung**: bật nếu đây là thiết bị có thể mượn kèm giữa các phòng
     (VD: micro không dây dùng chung); tắt nếu là tài sản cố định thuộc riêng phòng
     này (VD: bàn ghế lắp sẵn).
3. Bấm **Lưu**.

### 4.2. Sửa / Xóa tài sản

Tương tự phần Sửa/Xóa phòng ở mục 3.2–3.3: bấm biểu tượng bút chì để sửa (form tự
điền sẵn dữ liệu hiện có), biểu tượng thùng rác để xóa (có xác nhận trước khi xóa).

### 4.3. Quay lại danh sách phòng

Bấm **Quay lại danh sách phòng** hoặc vào lại mục **Quản lý phòng** ở menu bên trái.

## 5. Đăng xuất

Bấm **Đăng xuất** ở góc trên bên phải màn hình. Hệ thống sẽ đưa về lại trang đăng
nhập. Nếu sau đó cố truy cập thẳng vào một trang quản trị bằng cách dán link, hệ
thống sẽ tự động yêu cầu đăng nhập lại — dữ liệu không bị lộ cho người chưa đăng nhập.

## 6. Câu hỏi thường gặp

**Tôi bấm Lưu nhưng không thấy gì xảy ra?**
Kiểm tra các ô có dấu `*` đỏ (bắt buộc) đã điền đủ chưa — hệ thống sẽ gạch chân đỏ ô
còn thiếu/sai và không cho lưu tới khi sửa đúng.

**Tôi quên mật khẩu / bị khóa tài khoản?**
Liên hệ quản trị viên kỹ thuật của hệ thống — màn hình tự khôi phục mật khẩu chưa có
ở bản này.

**Trang không tải được / báo lỗi "Đã có lỗi xảy ra"?**
Thử tải lại trang (F5). Nếu vẫn lỗi, chụp lại màn hình và báo cho quản trị viên kỹ
thuật kèm thời điểm xảy ra để tra log.

## 7. Sắp có (các bản cập nhật tiếp theo)

Theo đúng lộ trình đã lên kế hoạch cho hệ thống:

- **Trang công khai** để các đơn vị tự đăng ký mượn phòng trực tuyến, kèm đính kèm
  văn bản, tra cứu trạng thái đơn bằng mã đơn.
- **Trang duyệt đơn**: xem văn bản đính kèm ngay trên trình duyệt, duyệt/từ chối kèm
  lý do, tự động gửi email kết quả cho đơn vị đăng ký.
- **Lịch phòng** xem theo tháng/tuần/theo từng phòng.
- **Phiếu mượn/trả phòng** in PDF kèm mã QR.
- **Báo cáo, thống kê** tần suất sử dụng phòng theo thời gian.

Tài liệu này sẽ được cập nhật khi các tính năng trên hoàn thành.
