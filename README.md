# CRMS-KGU

Hệ thống quản lý phòng cho Trung tâm Hội nghị — Trường Đại học Kiên Giang. Đăng ký
mượn phòng online, duyệt đơn, quản lý phòng/tài sản, in phiếu mượn-trả, báo cáo.

Đọc thêm: đặc tả nghiệp vụ ở [`docs/spec.md`](docs/spec.md), hướng dẫn dùng trang
quản trị (cho cán bộ, không cần biết code) ở
[`docs/huong-dan-su-dung.md`](docs/huong-dan-su-dung.md), quy ước code cho ai maintain
sau này ở [`CLAUDE.md`](CLAUDE.md).

Stack: Spring Boot 4 (Java 21) + PostgreSQL 16 ở backend, React + Vite + TypeScript +
Ant Design ở frontend, Flyway lo schema, JWT lo auth, Docker Compose lo deploy.

Đã xong: quản lý phòng/tài sản, đăng ký mượn phòng công khai + duyệt/từ chối, lịch
(FullCalendar + iCal), email tự động, cấu hình qua UI, quản lý người dùng. Đang làm:
phiếu mượn/trả + báo cáo (P2).

## Chạy thử nhanh nhất — Docker Compose

```bash
cd deploy
cp .env.example .env
```

Sửa `POSTGRES_PASSWORD` và `JWT_SECRET` trong `.env` (mặc định chỉ để test cục bộ,
đừng dùng khi chạy thật).

```bash
docker compose up --build
```

Build lần đầu khá lâu (~25-30 phút, do Maven tải dependency từ đầu trong container),
lần sau nhanh hơn nhiều nhờ cache layer. Xong thì vào:

- Frontend: http://localhost:8092
- Swagger: http://localhost:8090/swagger-ui.html
- Health check: http://localhost:8090/actuator/health

Đăng nhập `admin` / `Admin@123` (đổi ngay nếu deploy thật, tài khoản này seed sẵn
trong `V2__seed.sql`).

Dừng: `docker compose down` (giữ data), thêm `-v` nếu muốn xóa luôn DB.

## Chạy dev không qua Docker

Cần Java 21, Maven (đã có `mvnw`), Node 20+, và một Postgres 16+ đang chạy đâu đó.

Backend:

```bash
cd backend
export DB_HOST=localhost DB_PORT=5432 DB_NAME=crms_kgu DB_USER=crms DB_PASSWORD=crms
export JWT_SECRET=dev-secret-it-just-needs-to-be-32-bytes-or-longer
./mvnw spring-boot:run
```

(PowerShell thì `$env:DB_HOST = "localhost"` thay vì `export`.) Flyway tự chạy
migration lúc khởi động, không cần làm gì thêm.

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Mặc định chạy ở http://localhost:5173.

## Vài điều cần biết trước khi đụng vào

- Cổng mặc định lệch chuẩn (8090/8092/5433/3050 thay vì 8080/5432) — chọn vậy để
  không đụng máy nào đã có sẵn Postgres hay service khác chạy 8080. Đổi được trong
  `deploy/.env`, nhớ sửa `CORS_ALLOWED_ORIGINS` theo nếu đổi port frontend.
- Chưa có test tự động. Logic quan trọng nhất (chống trùng lịch) nằm ở constraint
  CSDL chứ không phải code Java, xem `V1__init.sql`.
- Chi tiết hơn (kiến trúc, quyết định thiết kế, bug đã gặp lúc build) nằm trong
  `CLAUDE.md` — đọc trước khi sửa gì lớn.

## Lộ trình

Xem `docs/spec.md` mục 17 để biết đầy đủ P0 → P3. Trạng thái hiện tại thì xem
`CLAUDE.md`, phần đầu file luôn ghi rõ đang ở giai đoạn nào.
