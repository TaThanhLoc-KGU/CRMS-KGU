# Hướng dẫn sử dụng — CRMS-KGU (Trang quản trị)

Tài liệu này dành cho **cán bộ Phòng Quản trị Cơ sở Vật chất** (vai trò Admin/Officer)
sử dụng trang quản trị của hệ thống Quản lý Phòng, Trung tâm Hội nghị Trường Đại học
Kiên Giang. Không cần biết lập trình để đọc tài liệu này.

> **Phạm vi hiện tại:** hệ thống đã có đầy đủ *quản lý phòng/tài sản*, *cổng công khai
> đăng ký mượn phòng*, *duyệt/từ chối đơn (kể cả duyệt nhiều cấp)*, *lịch phòng*,
> *email tự động*, *cấu hình*, *quản lý người dùng*, *phiếu mượn/trả in PDF kèm mã QR*,
> *báo cáo thống kê* và *nhật ký kiểm toán*. Các tính năng nâng cao (quét QR tự động,
> Zalo, đăng nhập một lần qua tài khoản trường...) chưa có — xem mục "Sắp có" ở cuối.

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

## 5. Cổng công khai — nơi các đơn vị tự đăng ký mượn phòng

Các đơn vị trong trường (khoa, phòng ban, câu lạc bộ...) **không cần tài khoản** —
họ vào thẳng trang chủ hệ thống (cùng địa chỉ, không có `/admin`) để:

- Xem danh sách phòng, xem lịch phòng (biết phòng nào trống/đã kín lịch).
- Bấm **Đăng ký mượn phòng này** ở trang chi tiết phòng → điền đơn vị, người liên hệ,
  email, ngày giờ sử dụng, thiết bị mượn thêm (máy chiếu, mic...), đính kèm văn bản
  (PDF/DOC/DOCX/JPG/PNG) → gửi.
- Hệ thống tự kiểm tra: phải đăng ký trước tối thiểu 48 giờ (chỉnh được ở mục Cấu
  hình), phải trong giờ làm việc, không trùng lịch với đơn đã duyệt khác. Sai điều
  kiện nào thì báo lỗi ngay, không cho gửi.
- Gửi thành công → hệ thống cấp **mã đơn** (VD `CRMS-2026-000123`) và gửi email xác
  nhận. Đơn vị dùng mã này + email đã đăng ký để **tự tra cứu trạng thái** ở trang
  "Tra cứu đơn", không cần gọi điện hỏi.

Cán bộ tiếp nhận nên biết luồng này để hướng dẫn khi có đơn vị gọi điện hỏi cách đăng
ký, hoặc báo mất mã đơn.

## 6. Duyệt đơn mượn phòng

Đây là công việc chính hằng ngày sau khi hệ thống đã có đơn công khai gửi vào.

1. Vào mục **Duyệt đơn** ở menu bên trái — bảng liệt kê tất cả đơn, lọc được theo
   trạng thái (Đã tiếp nhận, Đã duyệt, Đã từ chối...) hoặc theo tên đơn vị.
2. Bấm vào một dòng để xem chi tiết: thông tin đơn vị/người liên hệ, phòng, thời gian,
   thiết bị yêu cầu thêm, và **văn bản đính kèm xem được ngay trên trang** (bấm
   **Xem**) — không cần tải file về máy. Vẫn có nút **Tải về** nếu cần lưu bản gốc.
3. Bấm **Duyệt đơn** nếu đồng ý, hoặc **Từ chối** kèm lý do bắt buộc. Hệ thống tự gửi
   email kết quả cho đơn vị đăng ký ngay sau khi bấm.
4. Nếu phòng đã kín lịch, bấm **Gợi ý phòng thay thế** — hệ thống liệt kê các phòng
   còn trống, đủ sức chứa, gần nhất với phòng ban đầu, để báo lại cho đơn vị.
5. **Hủy đơn** dùng khi đơn vị tự rút yêu cầu hoặc có lý do bất khả kháng (áp dụng
   được cả với đơn đã duyệt, miễn chưa tới ngày sử dụng).

> Chỉ tài khoản vai trò **Người duyệt (APPROVER)** hoặc **Quản trị viên (ADMIN)** mới
> bấm được Duyệt/Từ chối — tài khoản **Officer** xem được đơn nhưng nút này sẽ báo lỗi
> không có quyền nếu cố bấm.

Hệ thống cũng tự động gửi email **nhắc lịch** trước giờ sử dụng (mặc định 24 giờ,
chỉnh được ở mục Cấu hình) cho các đơn đã duyệt — không cần cán bộ nhắc tay.

**Đơn cần nhiều người duyệt?** Nếu quản trị viên bật cấu hình "Số cấp duyệt" lớn hơn 1,
một đơn cần được duyệt đủ số lần đó (bởi một hoặc nhiều người duyệt khác nhau) mới
chính thức chuyển sang "Đã duyệt" — trước đó đơn ở trạng thái "Đang xem xét" và người
duyệt tiếp theo vẫn thấy nút Duyệt/Từ chối bình thường. Mục "Lịch sử duyệt" trong trang
chi tiết đơn liệt kê đầy đủ ai đã duyệt ở cấp nào, lúc nào.

## 7. Lập phiếu mượn/trả phòng

Sau khi đơn đã **Đã duyệt**, vào trang chi tiết đơn để lập phiếu — mục **Phiếu
mượn/trả** nằm ngay dưới danh sách văn bản đính kèm.

### 7.1. Lập phiếu mượn (khi bàn giao phòng)

1. Bấm **Lập phiếu mượn**, điền tên người mượn thực tế đến nhận phòng (có thể khác
   người đăng ký ban đầu), đơn vị, số điện thoại, ghi chú nếu cần.
2. Hệ thống **tự động nạp toàn bộ tài sản/thiết bị của phòng** (đã khai báo ở mục
   "Quản lý tài sản") vào phiếu, kèm tình trạng hiện tại của từng món — không cần
   nhập tay danh sách CSVC.
3. Bấm **Xem/in PDF** để mở bản PDF chính thức (có mã QR, ô ký tên) — in ra cho hai bên
   ký trực tiếp khi bàn giao.
4. Đơn tự chuyển sang trạng thái "Đã lập phiếu".

### 7.2. Lập phiếu trả (khi nhận lại phòng)

1. Khi đơn vị trả phòng, vào lại trang chi tiết đơn, bấm **Lập phiếu trả**.
2. Hệ thống tự sao chép đúng danh sách CSVC từ phiếu mượn để đối chiếu — không phải
   nhập lại.
3. Với từng món, chọn **Tình trạng khi trả** (Nguyên vẹn / Hư hỏng / Thiếu) và ghi chú
   nếu có hư hỏng/thiếu hụt, rồi bấm **Lưu tình trạng khi trả**.
4. Bấm **Xem/in PDF** để in phiếu trả có đầy đủ đối chiếu trước–sau.
5. Đơn chuyển sang trạng thái "Đã trả phòng".

### 7.3. Nghiệm thu, hoàn tất đơn

Sau khi đã ghi nhận tình trạng trả phòng, bấm **Nghiệm thu, hoàn tất đơn** (ở khung
Thao tác) để đóng đơn hẳn. Đơn chuyển sang "Đã hoàn tất" — đây là bước cuối cùng trong
vòng đời một đơn mượn phòng.

## 8. Báo cáo, thống kê & xuất Excel

Vào mục **Báo cáo** ở menu bên trái (xem được bởi mọi vai trò đăng nhập).

- Chọn khoảng thời gian ở góc trên để xem: tổng số đơn, số đã duyệt/từ chối, thời gian
  xử lý trung bình (từ lúc nộp đến lúc có quyết định).
- Bảng **Tần suất sử dụng theo phòng**: phòng nào được dùng nhiều nhất, tổng số giờ sử
  dụng — hữu ích khi cần biết phòng nào đang quá tải.
- Bảng **Thống kê theo đơn vị**: đơn vị nào đăng ký nhiều, tỷ lệ đơn được duyệt.
- Bấm **Xuất Excel** để tải file `.xlsx` chứa đầy đủ hai bảng trên, dùng để báo cáo cấp
  trên hoặc lưu trữ.

Ngoài ra, ở trang **Quản lý tài sản** của từng phòng cũng có thể xuất riêng danh sách
kiểm kê CSVC của phòng đó ra Excel.

## 9. Cấu hình hệ thống (chỉ dành cho Quản trị viên)

Vào mục **Cấu hình** ở menu bên trái (chỉ tài khoản ADMIN nhìn thấy mục này). Các
nhóm cấu hình:

| Nhóm | Chỉnh được gì |
|---|---|
| Đặt phòng | Số giờ phải đăng ký trước, đăng ký sớm nhất bao nhiêu ngày, xử lý khi trùng lịch, số giờ nhắc lịch trước sự kiện, bật/tắt nhận đơn công khai |
| Giờ làm việc | Giờ bắt đầu/kết thúc nhận đặt phòng, ngày làm việc trong tuần |
| Upload tệp | Dung lượng tối đa mỗi file, định dạng cho phép |
| Email | Tên/địa chỉ email gửi đi, có nút **Gửi email thử** để kiểm tra SMTP |
| Lịch | Có hiện đơn chờ duyệt trên lịch công khai hay không |
| Thương hiệu | Tên đơn vị, logo hiển thị trên phiếu & email |

Sửa xong bấm **Lưu cấu hình** — áp dụng ngay cho các đơn đăng ký mới, không cần khởi
động lại hệ thống.

## 8. Quản lý người dùng nội bộ (chỉ dành cho Quản trị viên)

Vào mục **Người dùng** — chỉ ADMIN thấy mục này. Tạo tài khoản mới cho cán bộ:

1. Bấm **Thêm người dùng**, điền tên đăng nhập, mật khẩu tạm, họ tên, email, đơn vị,
   chọn **vai trò**:
   - **ADMIN** — toàn quyền, gồm cả cấu hình và quản lý người dùng.
   - **OFFICER** (Người lập phiếu) — xử lý ngày thường: xem đơn, quản lý phòng/tài
     sản; **không** duyệt/từ chối đơn được.
   - **APPROVER** (Người duyệt) — duyệt/từ chối đơn; không cần là ADMIN.
2. Bấm biểu tượng **chìa khóa** ở một tài khoản để đặt lại mật khẩu khi cán bộ quên.
3. Bấm biểu tượng **bút chì** để sửa thông tin hoặc khóa tài khoản (tắt "Hoạt động")
   khi cán bộ nghỉ việc — không nên xóa tài khoản để giữ lại lịch sử duyệt đơn.

## 9. Đăng xuất

Bấm **Đăng xuất** ở góc trên bên phải màn hình. Hệ thống sẽ đưa về lại trang đăng
nhập. Nếu sau đó cố truy cập thẳng vào một trang quản trị bằng cách dán link, hệ
thống sẽ tự động yêu cầu đăng nhập lại — dữ liệu không bị lộ cho người chưa đăng nhập.

## 10. Câu hỏi thường gặp

**Tôi bấm Lưu nhưng không thấy gì xảy ra?**
Kiểm tra các ô có dấu `*` đỏ (bắt buộc) đã điền đủ chưa — hệ thống sẽ gạch chân đỏ ô
còn thiếu/sai và không cho lưu tới khi sửa đúng.

**Tôi quên mật khẩu / bị khóa tài khoản?**
Liên hệ quản trị viên (ADMIN) để được đặt lại mật khẩu ở mục Người dùng — màn hình tự
khôi phục mật khẩu chưa có ở bản này.

**Đơn vị đăng ký báo không đăng ký được / báo lỗi "Phải đăng ký trước ít nhất 48 giờ"?**
Đây là quy tắc lead-time đang bật (chỉnh được ở mục Cấu hình). Nếu cần cho đăng ký gấp
hơn, giảm số giờ ở cấu hình `booking.min_lead_hours`, hoặc hướng dẫn đơn vị liên hệ
trực tiếp Phòng Quản trị Cơ sở Vật chất để xử lý ngoài hệ thống.

**Tôi bấm Duyệt/Từ chối nhưng báo không có quyền?**
Tài khoản của bạn đang ở vai trò OFFICER — chỉ ADMIN hoặc APPROVER mới duyệt được.
Liên hệ quản trị viên để đổi vai trò nếu công việc của bạn cần duyệt đơn.

**Trang không tải được / báo lỗi "Đã có lỗi xảy ra"?**
Thử tải lại trang (F5). Nếu vẫn lỗi, chụp lại màn hình và báo cho quản trị viên kỹ
thuật kèm thời điểm xảy ra để tra log.

## 11. Sắp có (các bản cập nhật tiếp theo)

- **Phiếu mượn/trả phòng** in PDF kèm mã QR, đối chiếu tình trạng cơ sở vật chất khi
  bàn giao và khi trả phòng.
- **Báo cáo, thống kê** tần suất sử dụng phòng, tỷ lệ duyệt/từ chối theo thời gian.
- **Duyệt đa cấp thật sự** (hiện chỉ có 1 cấp duyệt).

Tài liệu này sẽ được cập nhật khi các tính năng trên hoàn thành.
