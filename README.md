# CRMS-KGU — Hệ thống Quản lý Phòng, Trung tâm Hội nghị Trường Đại học Kiên Giang

Tài liệu | Dành cho | Nội dung
---|---|---
[`docs/spec.md`](docs/spec.md) | Mọi người | Đặc tả nghiệp vụ đầy đủ (nguồn sự thật)
[`docs/huong-dan-su-dung.md`](docs/huong-dan-su-dung.md) | **Cán bộ dùng trang quản trị** | Cách đăng nhập, quản lý phòng & tài sản — không cần biết code
`README.md` (file này) | **Người cài đặt/vận hành** | Cách chạy, build, deploy dự án
[`CLAUDE.md`](CLAUDE.md) | **Lập trình viên** | Quy ước code, kiến trúc, các bẫy kỹ thuật đã gặp

**Trạng thái:** P0 (khung nền) hoàn thành — CRUD Phòng & tài sản trong phòng chạy
đầu-cuối, có đăng nhập JWT, Swagger UI, health-check, chạy được bằng
`docker compose up`.

## Yêu cầu môi trường

- Docker Desktop (cách chạy khuyến nghị), hoặc
- Java 21+, Maven (kèm sẵn `mvnw`), Node.js 20+, PostgreSQL 16+ nếu chạy rời từng phần.

## Chạy nhanh bằng Docker Compose

```bash
cd deploy
cp .env.example .env
```

Mở `deploy/.env` và **đổi `POSTGRES_PASSWORD` và `JWT_SECRET`** (giá trị mặc định chỉ
để chạy thử cục bộ).

```bash
docker compose up --build
```

Sau khi các service khởi động xong (`docker compose ps` để kiểm tra):

| Địa chỉ | Nội dung |
|---|---|
| http://localhost:8092 | Frontend (trang quản trị) |
| http://localhost:8090/swagger-ui.html | Swagger UI (API docs) |
| http://localhost:8090/actuator/health | Health check |

Đăng nhập quản trị: **admin / Admin@123** (tài khoản seed sẵn trong
`V2__seed.sql` — đổi mật khẩu ngay nếu triển khai thật).

Dừng và xoá container (giữ lại dữ liệu DB nhờ volume):

```bash
docker compose down
```

Xoá luôn dữ liệu DB (bắt đầu lại từ đầu):

```bash
docker compose down -v
```

## Chạy rời từng phần (dev, không cần Docker cho code — vẫn cần Postgres)

**Backend** (cần một PostgreSQL 16+ đang chạy ở đâu đó, tự tạo database trống trước):

```bash
cd backend
export DB_HOST=localhost DB_PORT=5432 DB_NAME=crms_kgu DB_USER=crms DB_PASSWORD=crms
export JWT_SECRET=dev-secret-at-least-32-bytes-long-please
./mvnw spring-boot:run
```

Windows PowerShell: dùng `$env:DB_HOST = "localhost"` v.v. thay cho `export`.

Flyway tự chạy migration khi backend khởi động — không cần thao tác gì thêm.

**Frontend:**

```bash
cd frontend
cp .env.example .env   # sửa VITE_API_BASE_URL nếu backend không chạy ở cổng mặc định
npm install
npm run dev
```

Mặc định Vite chạy ở http://localhost:5173.

## Kiểm thử đã thực hiện cho P0

Đã kiểm thử thủ công (curl + psql trực tiếp vào container Postgres test), không phải
suy đoán:

- Đăng nhập JWT (`POST /api/v1/auth/login`), làm mới token (`/auth/refresh`).
- CRUD Phòng đầy đủ (`GET/POST/PUT/DELETE /api/v1/rooms`), thêm/xoá ảnh phòng.
- CRUD Tài sản trong phòng đầy đủ (`GET/POST/PUT/DELETE` dưới `/rooms/{id}/assets` và
  `/assets/{id}`).
- Lỗi trả đúng mã: 400 (validate/JSON sai định dạng), 401/403 (chưa đăng nhập), 404
  (không tồn tại), 409 (trùng mã phòng/mã tài sản).
- Tiếng Việt có dấu round-trip đúng qua toàn bộ chuỗi request → DB → response.
- **Ràng buộc chống trùng lịch ở CSDL** (`no_overlap_per_room`, EXCLUDE constraint):
  test trực tiếp bằng INSERT SQL vì Booking API chưa xây ở P0 —
  2 booking APPROVED trùng giờ cùng phòng bị CSDL từ chối; không trùng, khác phòng,
  hoặc khác trạng thái (chưa APPROVED) thì vẫn insert được bình thường.
- Migration Flyway chạy sạch từ database rỗng (`V1__init.sql` + `V2__seed.sql`).

Frontend đã test qua trình duyệt thật (không phải suy đoán): đăng nhập → danh sách
phòng (dữ liệu seed hiển thị đúng, tiếng Việt có dấu) → vào trang quản lý tài sản của
một phòng → thêm/sửa/xóa tài sản (toast xác nhận, bảng cập nhật ngay) → quay lại →
thêm/sửa/xóa phòng → đăng xuất (xóa token, chuyển về trang đăng nhập) → truy cập thẳng
`/admin/rooms` khi chưa đăng nhập bị chặn và chuyển hướng về `/admin/login` đúng như
thiết kế `RequireAuth`.

## Rủi ro / hạn chế đã biết của P0

- Ảnh phòng chỉ nhận URL dán tay, chưa upload file thật (dự kiến làm ở P1 cùng lúc với
  upload văn bản đính kèm khi đăng ký mượn phòng).
- Chưa có test tự động (unit/integration test) — P0 chỉ có CRUD đơn giản, đã kiểm thử
  thủ công đầy đủ; test tự động cho logic lõi (trùng lịch, lead-time) sẽ viết cùng
  `BookingService` ở P1 theo đúng yêu cầu spec.
- `docker compose up --build` build image từ đầu (Maven + npm). Lần build đầu tiên đã
  đo thực tế mất **~25–30 phút**, gần hết là do bước `mvn dependency:go-offline` tải
  toàn bộ dependency Spring Boot từ Maven Central bên trong container (không dùng
  chung cache `~/.m2` với máy host) — đây là chi phí một lần, các lần build sau chỉ
  tốn vài chục giây nhờ Docker layer cache (miễn `backend/pom.xml` không đổi).
- Cổng mặc định (8090 backend, 8092 frontend, 5433 postgres, 3050 gotenberg) được chọn
  để tránh đụng cổng phổ biến (8080, 5432); nếu máy bạn trống các cổng đó, có thể đổi
  lại trong `deploy/.env` cho ngắn gọn hơn — nhớ cập nhật `CORS_ALLOWED_ORIGINS` tương ứng.

## Bước tiếp theo

P1 — MVP đặt phòng: xem đặc tả §17 và mục "Việc chưa làm trong P0" trong `CLAUDE.md`.
