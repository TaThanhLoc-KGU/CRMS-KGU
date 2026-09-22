# PROMPT CHO CLAUDE CODE — Dự án CRMS-KGU

> **Cách dùng:**
> 1. Tạo thư mục dự án rỗng, đặt bản đặc tả vào `docs/spec.md` (chính là file `DacTa_QuanLyPhong_TrungTamHoiNghi_KGU.md`).
> 2. Mở Claude Code tại thư mục đó.
> 3. Dán toàn bộ nội dung bên dưới (phần trong khung) làm tin nhắn đầu tiên.

---

Bạn là kỹ sư phần mềm phụ trách xây dựng dự án **CRMS-KGU** — Hệ thống Quản lý Phòng của Trung tâm Hội nghị Trường Đại học Kiên Giang.

## 0. Việc đầu tiên — BẮT BUỘC
1. Đọc kỹ **`docs/spec.md`** (bản đặc tả đầy đủ) trước khi làm bất cứ gì. Đó là nguồn sự thật (source of truth).
2. Sau khi đọc, tóm tắt lại cho tôi **hiểu biết của bạn về dự án + kế hoạch P0** trong ~15 dòng, rồi mới bắt đầu code.
3. Tạo `CLAUDE.md` ở gốc repo ghi lại quy ước, kiến trúc, lệnh chạy — để các phiên sau đọc lại.

## 1. Ràng buộc không thương lượng (non-negotiable)
- **Stack:** Backend **Spring Boot 4.x** trên **Java 21 (LTS)**; Frontend **React + Vite + TypeScript**; CSDL **PostgreSQL 16+**.
- **KHÔNG dùng `hibernate.ddl-auto=update`.** Toàn bộ schema quản lý bằng **Flyway migration** (`db/migration/V1__init.sql`, V2, …).
- **Chống trùng lịch phải ở tầng CSDL** bằng `EXCLUDE USING gist (room_id WITH =, tstzrange(start_time,end_time,'[)') WITH &&) WHERE (status='APPROVED')` (bật extension `btree_gist`). Không được chỉ kiểm tra ở tầng ứng dụng.
- **Mọi tham số cấu hình được** (thời gian đăng ký tối thiểu, giờ làm việc, giới hạn upload, SMTP, mẫu email…) lưu ở bảng `configurations`, đọc/ghi qua API — không hardcode.
- **Giao diện tiếng Việt** là mặc định (chừa sẵn cấu trúc i18n để thêm tiếng Anh sau).
- **Bí mật (SMTP, JWT secret, DB password) nằm trong biến môi trường / `.env`**, KHÔNG commit. Cung cấp `.env.example`.
- Java package gốc: **`vn.edu.vnkgu.crms`**.

## 2. Giả định mặc định (được phép đổi nếu tôi yêu cầu)
- **Lưu file:** đĩa cục bộ, ẩn sau interface `StorageService` (để sau swap sang Nextcloud/MinIO). Xem nhanh tài liệu: file PDF dùng trực tiếp; file Office chuyển sang PDF bằng **Gotenberg** (service trong docker-compose).
- **Duyệt 1 cấp** mặc định (`booking.require_approval_levels=1`) nhưng bảng `approvals` phải thiết kế sẵn cho đa cấp.
- Build tool backend: **Maven** (nếu bạn thấy Gradle hợp hơn thì đề xuất, đừng tự đổi).
- UI kit: **Ant Design** (mạnh cho form/table hành chính) + **FullCalendar** (lịch) + **react-pdf/PDF.js** (xem file).

## 3. Cấu trúc thư mục mục tiêu
```
crms-kgu/
├── docs/spec.md
├── backend/                # Spring Boot 4 (Java 21)
│   └── src/main/java/vn/edu/vnkgu/crms/{config,security,booking,room,asset,handover,mail,report,common}
│   └── src/main/resources/{db/migration, templates/mail}
├── frontend/               # React + Vite + TS
│   └── src/{pages,components,api,hooks,layouts,i18n}
├── deploy/
│   ├── docker-compose.yml  # postgres + gotenberg + backend + frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── .env.example
├── CLAUDE.md
└── README.md
```

## 4. Quy ước code
- **Backend phân lớp:** `controller → service → repository`; dùng **DTO** (không trả entity trực tiếp), **Bean Validation** cho input, **global exception handler** trả lỗi chuẩn JSON, **OpenAPI/Swagger UI** cho API.
- **Bảo mật:** Spring Security + **JWT** (access + refresh), mật khẩu **BCrypt**; RBAC 3 vai trò `ADMIN/OFFICER/APPROVER`. Chừa sẵn chỗ gắn **LDAP/Active Directory** (SSO) sau.
- **DB:** snake_case; mốc thời gian dùng `timestamptz`; ràng buộc khóa ngoại đầy đủ.
- **Frontend:** gọi API qua lớp `api/` tập trung; quản lý dữ liệu bằng **React Query**; routing bằng react-router; tách **khu Public** và **khu Admin (đăng nhập)**.
- **Upload:** kiểm định dạng bằng magic bytes, giới hạn dung lượng theo cấu hình, đổi tên khi lưu.
- Viết **test** cho phần lõi: logic kiểm tra trùng lịch & lead-time.
- Commit nhỏ, message rõ ràng theo Conventional Commits.

## 5. Kế hoạch theo giai đoạn — LÀM XONG P0 RỒI DỪNG LẠI CHỜ TÔI DUYỆT

### ▶ P0 — Khung nền (làm ngay bây giờ)
Mục tiêu: dự án chạy được `docker compose up`, có DB + schema + 1 lát cắt CRUD hoàn chỉnh.
- [ ] Khởi tạo `backend` (Spring Boot 4, Java 21, Maven) + `frontend` (Vite + React + TS).
- [ ] `deploy/docker-compose.yml`: **postgres**, **gotenberg**, **backend**, **frontend**; `.env.example`.
- [ ] **Flyway `V1__init.sql`**: tạo toàn bộ bảng lõi trong đặc tả (rooms, room_images, setup_styles, room_setup_styles, assets, equipment_catalog, bookings, booking_equipments, booking_attachments, approvals, handover_slips, handover_items, users, roles, configurations, email_templates, email_logs, audit_logs, working_hours, public_holidays) + **ràng buộc EXCLUDE chống trùng lịch** + `V2__seed.sql` nạp **danh sách phòng thật ở Phụ lục đặc tả** và cấu hình mặc định.
- [ ] Auth JWT (đăng nhập admin) + 1 tài khoản admin seed.
- [ ] **CRUD Phòng + tài sản trong phòng** hoàn chỉnh (API + màn hình admin) như một lát cắt mẫu chạy được đầu-cuối.
- [ ] Swagger UI + trang health-check + `README.md` hướng dẫn chạy + `CLAUDE.md`.

**Định nghĩa Hoàn thành (DoD) P0:** clone về, `cp .env.example .env`, `docker compose up` → mở được frontend, đăng nhập admin, thêm/sửa phòng và thêm thiết bị vào phòng, Swagger truy cập được, migration chạy sạch.

**➡ Xong P0: DỪNG, tóm tắt những gì đã làm + cách chạy + rủi ro, rồi hỏi tôi trước khi sang P1.**

### ▶ P1 — MVP đặt phòng (sau khi tôi duyệt P0)
- Trang công khai: landing, danh sách/chi tiết phòng, **form đăng ký + upload nhiều văn bản**.
- Validate **lead-time** + **giờ làm việc** + **kiểm tra trùng lịch** (chặn/waitlist theo cấu hình); sinh **mã đơn**; email "đã tiếp nhận".
- Trang admin duyệt: danh sách + chi tiết + **xem file inline không tải về** (PDF.js; Office→PDF qua Gotenberg) + **Duyệt/Từ chối kèm lý do** → **gửi email kết quả (SMTP, mẫu Thymeleaf, gửi @Async + ghi email_logs)**.
- **Lịch công khai** (FullCalendar) + endpoint **iCal**.
- Module **cấu hình** (đọc/ghi + nút "gửi mail thử").

### ▶ P2 — Phiếu & chuẩn hóa
- **Phiếu mượn/trả** (người lập phiếu, người mượn, danh sách CSVC tự nạp từ phòng) → **in PDF + QR** (JasperReports hoặc OpenPDF + ZXing).
- Báo cáo/thống kê + xuất Excel/PDF; **audit log**; trình soạn **mẫu email**; **duyệt đa cấp**.

### ▶ P3 — Nâng cao
- QR check-in/out, gợi ý phòng thay thế, nhắc lịch (Scheduler), đồng bộ Google/Outlook, **SSO Active Directory**, thông báo **Zalo OA**, digital signage, đăng ký định kỳ/waitlist, tham chiếu mã tài sản với hệ quản lý tài sản công.

## 6. Nguyên tắc làm việc với tôi
- Ưu tiên **chạy được đầu-cuối theo lát cắt dọc**, không viết hàng loạt file chết.
- Khi có quyết định thiết kế mơ hồ → **hỏi ngắn gọn** hoặc chọn mặc định hợp lý và **ghi rõ giả định**, đừng im lặng làm bừa.
- Sau mỗi giai đoạn: cập nhật `CLAUDE.md` + `README.md`, liệt kê việc đã làm và cách kiểm thử.
- Không thêm phụ thuộc nặng nếu không cần; giải thích ngắn khi chọn thư viện.

**Bắt đầu bằng bước 0 (đọc `docs/spec.md`, tóm tắt, tạo `CLAUDE.md`), rồi làm P0.**
