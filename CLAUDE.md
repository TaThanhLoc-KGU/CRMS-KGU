# CLAUDE.md — CRMS-KGU

Hướng dẫn cho Claude Code (và người kế nhiệm) khi làm việc tiếp trên dự án này.
Nguồn sự thật về nghiệp vụ là [`docs/spec.md`](docs/spec.md) — đọc lại file đó trước khi
thay đổi phạm vi hoặc luồng nghiệp vụ.

## Trạng thái hiện tại

**P0 (khung nền) — hoàn thành.** CRUD Phòng + tài sản trong phòng chạy đầu-cuối qua
Docker Compose, có JWT auth, Swagger UI, health-check. Xem "Lộ trình" trong spec §17
cho các giai đoạn tiếp theo (P1: MVP đặt phòng; P2: phiếu & báo cáo; P3: nâng cao).

## Ngăn xếp công nghệ

| Lớp | Công nghệ | Phiên bản đã dùng |
|---|---|---|
| Backend | Spring Boot, Java | 4.1.1, Java 21 (biên dịch bằng JDK 25 cài trên máy, `--release 21`) |
| Migration | Flyway | đi kèm Spring Boot 4.1.1 (flyway-core 12.x) |
| Auth | Spring Security + JWT | jjwt 0.13.0 |
| API docs | springdoc-openapi | 3.1.1 (bản hỗ trợ Spring Framework 7 / Boot 4) |
| Frontend | React + Vite + TypeScript | React 19, Vite 7 |
| UI kit | Ant Design | 5.x |
| Data fetching | @tanstack/react-query | 5.x |
| CSDL | PostgreSQL | 16 (image chính thức trong docker-compose) |

**Vì sao các phiên bản này:** Spring Initializr's `bootVersion` metadata trả về id
dạng `4.1.1.RELEASE` nhưng artifact thật trên Maven Central là `4.1.1` (không có hậu tố
`.RELEASE` — quy ước đổi từ Boot 3.x). Nếu thấy lỗi
`Non-resolvable parent POM ... 4.x.x.RELEASE`, đó là nguyên nhân — sửa lại version
trong `backend/pom.xml`, đừng đoán ngược lại thêm `.RELEASE`.

## Cấu trúc thư mục

```
crms-kgu/
├── docs/spec.md              # Đặc tả — nguồn sự thật nghiệp vụ
├── backend/
│   └── src/main/java/vn/edu/vnkgu/crms/
│       ├── common/            # ApiException, GlobalExceptionHandler, ApiErrorResponse
│       ├── config/            # SecurityConfig, OpenApiConfig, JwtProperties
│       ├── security/          # User, Role, JWT filter/service, AuthController
│       ├── room/               # Room, RoomImage, SetupStyle (schema only), CRUD
│       └── asset/               # Asset (tài sản/thiết bị trong phòng), CRUD
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/      # V1__init.sql, V2__seed.sql (Flyway)
├── frontend/
│   └── src/{api,components,hooks,i18n,layouts,pages}
└── deploy/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    ├── nginx.conf
    └── .env.example
```

Các package `booking`, `handover`, `mail`, `report` trong đặc tả gốc **chưa được tạo**
— chỉ tạo khi thực sự cần code cho phase đó (P1/P2), tránh có sẵn thư mục rỗng vô nghĩa.
Bảng CSDL tương ứng (`bookings`, `handover_slips`, `email_templates`, …) đã có sẵn từ
`V1__init.sql` vì Flyway quản lý schema độc lập với việc entity Java đã tồn tại hay chưa.

## Quy ước bắt buộc (không đổi khi làm phase sau)

- **Không bao giờ `hibernate.ddl-auto=update`.** Luôn `validate`. Đổi schema ⇒ viết
  migration mới `V{n}__mo_ta.sql` trong `backend/src/main/resources/db/migration/`,
  không sửa lại file V cũ đã áp dụng.
- **Chống trùng lịch ở CSDL, không phải ở code.** Ràng buộc
  `no_overlap_per_room` (EXCLUDE USING gist) trên bảng `bookings` là cơ chế chặn
  duy nhất được tin cậy — xem `V1__init.sql`. Khi viết `BookingService` (P1), đừng
  thêm kiểm tra trùng lịch kiểu "SELECT rồi so sánh" làm cơ chế chính; chỉ dùng nó để
  báo lỗi thân thiện trước, catch `DataIntegrityViolationException` từ ràng buộc DB
  làm lưới an toàn cuối cùng.
- **Mọi tham số vận hành nằm ở bảng `configurations`** (đã seed theo đặc tả §10),
  đọc/ghi qua API `/api/v1/config` (chưa build ở P0, xem "Việc chưa làm" bên dưới).
  Không hardcode `min_lead_hours`, giờ làm việc, SMTP, v.v. trong code.
- **JVM luôn chạy UTC.** `CrmsBackendApplication.main()` gọi
  `TimeZone.setDefault(UTC)` trước `SpringApplication.run` — xem "Bẫy đã gặp" bên dưới
  để biết lý do. Đừng xoá dòng này.
- **PUT là full-replace**, không phải partial patch. Field không gửi lên = ghi đè
  thành `null`/mặc định. Frontend edit form phải load đủ dữ liệu hiện tại trước khi
  cho sửa (xem `RoomFormModal.tsx` — `useEffect` gọi `form.setFieldsValue` với toàn bộ
  record khi mở modal sửa).
- **secrets qua biến môi trường**, không hardcode, không commit `.env` thật (chỉ commit
  `.env.example`). `deploy/.env.example` là nguồn cấu hình cho `docker compose up`.

## Bẫy đã gặp khi dựng P0 (đọc trước khi "sửa lại cho giống code cũ")

1. **`FATAL: invalid value for parameter "TimeZone": "Asia/Saigon"` khi Flyway kết
   nối DB.** Nguyên nhân: JDBC driver gửi timezone mặc định của JVM (theo máy host)
   làm startup parameter; image `postgres:16` không nhận alias `Asia/Saigon` (chỉ có
   `Asia/Ho_Chi_Minh`). Đã fix bằng cách ép JVM về UTC ngay đầu `main()` — xem trên.
   Đừng fix bằng cách sửa tzdata trong container, không bền.
2. **`@UpdateTimestamp` (Hibernate) trả về giá trị cũ trong response** nếu bạn
   `repository.save(entity)` rồi map sang DTO ngay trong cùng method. Hibernate hoãn
   UPDATE tới lúc flush (thường là cuối transaction), sau khi method đã return xong.
   Fix: dùng `saveAndFlush(...)` cho các thao tác update cần trả `updatedAt` mới ngay.
   (`INSERT` với `GenerationType.IDENTITY` thì không bị vấn đề này vì Hibernate bắt
   buộc insert ngay lập tức để lấy id sinh ra.)
3. **`entityManager.merge()` không set id sinh ra lên object con transient khi cascade
   qua parent đã managed.** Ví dụ: `room` (đã có id) `.getImages().add(newImage)` rồi
   `roomRepository.save(room)` → Hibernate chạy nhánh `merge()` (vì `room` không phải
   entity mới), và merge cascade sẽ copy `newImage` sang một instance managed khác rồi
   trả về **instance mới đó**, không set gì lên `newImage` bạn đang giữ. Kết quả:
   response trả `"id": null`. Fix: persist entity con trực tiếp qua repository của nó
   (`roomImageRepository.saveAndFlush(newImage)`), không đi qua cascade của parent khi
   bạn cần đọc lại id vừa sinh ngay trong cùng request.
4. **Client gửi JSON sai định dạng bị trả về 500 thay vì 400.** `@RestControllerAdvice`
   generic `Exception.class` handler bắt luôn cả `HttpMessageNotReadableException`
   (JSON parse lỗi — lỗi của client) nếu không có handler riêng đứng trước nó. Đã thêm
   handler riêng trong `GlobalExceptionHandler` trả 400. Khi thêm exception mới, luôn
   tự hỏi "đây là lỗi client (4xx) hay lỗi server (5xx)" thay vì để rơi vào nhánh chung.
5. **Không dùng cổng 8080/8081/3307/5432 mặc định để test cục bộ trên máy dev này** —
   máy đã có project khác (`qlts-kgu`, quản lý tài sản công) chiếm các cổng đó qua
   Docker, cộng với PostgreSQL 18 cài native trên 5432. `docker-compose.yml` của CRMS
   dùng 8090 (backend), 8092 (frontend), 5433 (postgres), 3050 (gotenberg) để tránh
   đụng độ — xem `deploy/.env.example`. Nếu đổi cổng, nhớ cập nhật cả CORS
   `allowed-origins` ở backend.
6. **`GlobalExceptionHandler` phải log exception trước khi trả message chung chung.**
   Ban đầu handler `Exception.class` chỉ trả "Đã có lỗi xảy ra..." mà không log gì —
   không cách nào debug lỗi 500 thật. Đã thêm `log.error(...)` kèm stack trace đầy đủ.
7. **`npm run dev` (Vite) không type-check — chỉ transpile.** Một mảng khai báo
   `as const` (kiểu readonly tuple) vẫn chạy ngon trong dev server nhưng làm
   `tsc -b` (chạy trong `npm run build`, và trong `Dockerfile.frontend`) fail vì AntD's
   `Select options` prop đòi `DefaultOptionType[]` (mutable), không nhận readonly
   tuple. **Bài học:** đừng coi "chạy được ở `npm run dev`" là đủ để kết luận frontend
   ổn — phải chạy `npm run build` (hoặc để `docker compose build` tự chạy) trước khi
   báo xong việc.

## Chạy dự án

### Cách nhanh nhất — Docker Compose

```bash
cd deploy
cp .env.example .env    # sửa POSTGRES_PASSWORD và JWT_SECRET trước khi dùng thật
docker compose up --build
```

- Frontend: http://localhost:8092
- Backend Swagger UI: http://localhost:8090/swagger-ui.html
- Health check: http://localhost:8090/actuator/health
- Tài khoản seed: `admin` / `Admin@123` (**đổi ngay** nếu deploy thật)

### Chạy rời từng phần (dev)

Backend cần một PostgreSQL 16+ đang chạy (không nhất thiết qua Docker):

```bash
cd backend
export DB_HOST=localhost DB_PORT=5433 DB_NAME=crms_kgu DB_USER=crms DB_PASSWORD=crms
export JWT_SECRET=dev-secret-at-least-32-bytes-long
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
cp .env.example .env   # trỏ VITE_API_BASE_URL về backend đang chạy
npm install
npm run dev
```

## Việc chưa làm trong P0 (cố ý, để P1 xử lý)

- Không có API `/api/v1/config` (đọc/ghi cấu hình) dù bảng `configurations` đã seed —
  P0 không có nghiệp vụ nào cần đọc cấu hình động (lead-time, giờ làm việc chỉ dùng khi
  có luồng đặt phòng). Đừng build UI cấu hình trước khi có chỗ dùng nó.
- Ảnh phòng (`room_images`) chỉ nhận URL dán tay, chưa có upload file thật. Upload file
  kèm `StorageService` interface (ẩn sau để swap Nextcloud/MinIO), magic-byte
  validation, và bản xem nhanh qua Gotenberg — làm ở P1 khi có form đăng ký + đính kèm
  văn bản (đây là nơi upload file thật sự cần).
- `SetupStyle`/`room_setup_styles`, `equipment_catalog` đã có bảng + seed dữ liệu
  nhưng chưa có entity Java/API — chỉ cần khi build form đặt phòng (P1).
- Gotenberg đã chạy sẵn trong `docker-compose.yml` nhưng backend chưa gọi tới —
  dùng ở P1 để xem nhanh file Office → PDF.
- Bundle frontend production build ~1.2MB (gzip ~385KB), Vite cảnh báo "chunk lớn hơn
  500KB" — chủ yếu do Ant Design. Chưa đáng để code-split ở quy mô P0 (1 trang admin
  đơn giản); cân nhắc `dynamic import()` cho các trang lớn hơn khi UI phình ra ở P1/P2.
- Không có test tự động (unit/integration) cho P0 — theo yêu cầu spec, test cho logic
  lõi (kiểm tra trùng lịch, lead-time) sẽ viết cùng lúc với `BookingService` ở P1, vì
  P0 không có logic nghiệp vụ phức tạp nào đáng test riêng (CRUD đơn giản đã được xác
  minh thủ công qua Swagger/curl — xem phần "Đã kiểm thử" trong README).

## Quy ước code

- DTO là `record` Java, không trả entity trực tiếp qua controller.
- Service method ghi dữ liệu luôn `@Transactional`; class mặc định
  `@Transactional(readOnly = true)`, override `@Transactional` (ghi) ở từng method cần.
- Exception nghiệp vụ kế thừa `vn.edu.vnkgu.crms.common.ApiException` (mang sẵn
  `HttpStatus`) — không throw `RuntimeException` trần cho lỗi có thể đoán trước
  (404, 409, ...).
- **Không dùng Lombok** — DTO là `record` (đã gọn sẵn), JPA entity viết getter/setter
  tay. Số lượng entity ở P0 còn ít (5 entity) nên chưa đáng đánh đổi lấy thêm một
  annotation processor; nếu số entity tăng nhiều ở P1/P2 và boilerplate thực sự gây
  khó chịu, có thể xét lại — nhưng phải đổi nhất quán cho toàn bộ entity, không trộn
  nửa Lombok nửa tay trong cùng codebase.
- Frontend gọi API qua `src/api/*.ts` (axios instance dùng chung ở `api/client.ts`,
  tự đính JWT vào header, tự logout khi 401). Không gọi `axios` trực tiếp trong page.
- i18n: chuỗi tiếng Việt nằm trong `src/i18n/vi.ts` (dictionary phẳng theo nhóm tính
  năng). Thêm `en.ts` cùng shape khi cần đa ngôn ngữ — chưa dùng thư viện i18next để
  tránh phụ thuộc không cần thiết lúc chỉ có 1 locale.

## Kiểm thử đã làm cho P0 (thủ công, xem README để tái lập)

Đã xác minh qua curl/psql trực tiếp (không phải suy đoán): đăng nhập JWT, CRUD phòng,
CRUD tài sản, lỗi 400/404/409 trả đúng, và — quan trọng nhất — **ràng buộc
`no_overlap_per_room` chặn đúng 2 booking APPROVED trùng giờ cùng phòng, cho qua nếu
khác phòng/khác giờ/khác trạng thái**, test trực tiếp bằng INSERT SQL vì chưa có
Booking API ở P0.
