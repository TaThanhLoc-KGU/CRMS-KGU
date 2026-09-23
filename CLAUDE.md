# CLAUDE.md — CRMS-KGU

Hướng dẫn cho Claude Code (và người kế nhiệm) khi làm việc tiếp trên dự án này.
Nguồn sự thật về nghiệp vụ là [`docs/spec.md`](docs/spec.md) — đọc lại file đó trước khi
thay đổi phạm vi hoặc luồng nghiệp vụ.

## Trạng thái hiện tại

**P0 + P1 — hoàn thành.** P0: CRUD Phòng + tài sản. P1 (MVP đặt phòng): trang công khai
đăng ký mượn phòng (upload văn bản, kiểm tra lead-time/giờ làm việc/ngày lễ, kiểm tra
trùng lịch), trang admin duyệt/từ chối/hủy đơn với xem file đính kèm inline, lịch công
khai + nội bộ (FullCalendar) + feed iCal, email tự động (nhận đơn/duyệt/từ chối/nhắc
lịch), module cấu hình đọc/ghi qua UI, quản lý người dùng nội bộ (RBAC 3 vai trò), gợi ý
phòng thay thế khi trùng lịch. Toàn bộ đã test qua Docker thật + trình duyệt thật, không
phải suy đoán — xem "Kiểm thử đã làm cho P1" bên dưới.

Đang làm: P2 (phiếu mượn/trả + PDF/QR, báo cáo thống kê, audit log, duyệt đa cấp) và P3
(nâng cao). Xem "Lộ trình" trong spec §17.

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
├── docs/
│   ├── spec.md                 # Đặc tả — nguồn sự thật nghiệp vụ
│   └── huong-dan-su-dung.md    # Hướng dẫn dùng trang quản trị (cho cán bộ, không phải dev)
├── backend/
│   └── src/main/java/vn/edu/vnkgu/crms/
│       ├── common/              # ApiException, GlobalExceptionHandler, ApiErrorResponse
│       │   ├── storage/          # StorageService + LocalDiskStorageService, FileValidator (magic bytes)
│       │   └── preview/          # PreviewConversionService (Gotenberg), PreviewTokenService (signed URL)
│       ├── config/               # SecurityConfig, OpenApiConfig, JwtProperties
│       │   └── domain/            # Configuration entity/service/controller (bảng configurations)
│       ├── security/             # User, Role, JWT filter/service, AuthController, UserController (admin)
│       ├── mail/                 # EmailTemplate, EmailLog, MailService (JavaMailSender + {{var}} substitution)
│       ├── room/                 # Room, RoomImage, SetupStyle, CRUD + PublicRoomController
│       ├── asset/                # Asset (tài sản/thiết bị trong phòng), CRUD
│       └── booking/              # Booking, BookingAttachment/Equipment, Approval, EquipmentCatalog,
│                                  # WorkingHours/PublicHoliday, SchedulingRulesService, BookingService,
│                                  # ReminderScheduler, PublicBookingController, BookingController (admin)
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/        # V1__init, V2__seed, V3__email_templates, V4__booking_reminders
├── frontend/
│   └── src/
│       ├── api/                  # 1 file/domain: rooms, assets, bookings, config, catalog, users, emailTemplates
│       ├── layouts/              # AdminLayout (sau đăng nhập) và PublicLayout (trang công khai) — tách biệt
│       └── pages/{public,admin}  # public/ = không cần đăng nhập, admin/ = sau RequireAuth
└── deploy/
    ├── docker-compose.yml       # postgres, gotenberg, backend, frontend(nginx)
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    ├── nginx.conf
    └── .env.example
```

`handover` (phiếu mượn/trả) và `report` (báo cáo) trong đặc tả gốc **chưa được tạo** —
đó là P2. Bảng CSDL tương ứng (`handover_slips`, `handover_items`, `audit_logs`) đã có
sẵn từ `V1__init.sql` vì Flyway quản lý schema độc lập với việc entity Java đã tồn tại
hay chưa.

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

### Bẫy đã gặp khi làm P1

8. **Trang công khai gọi nhầm API admin.** `RoomsPublicPage`, `LandingPage`, v.v. lúc
   đầu import `listRooms`/`getRoom` từ `api/rooms.ts` — đó là hàm gọi `/api/v1/rooms`
   (yêu cầu JWT, trả cả phòng MAINTENANCE/DISABLED). Khách vãng lai chưa đăng nhập nên
   nhận 403, phòng trống trơn. Fix: thêm `listPublicRooms`/`getPublicRoom` gọi
   `/api/v1/public/rooms` riêng, không sửa hàm admin. **Bài học:** mỗi khi thêm trang
   `pages/public/*`, kiểm tra ngay hàm `api/*.ts` nó gọi có đúng là biến thể `/public/`
   không — cùng một resource (Room) có 2 bộ endpoint khác nhau cho 2 đối tượng.
9. **Cascade-persist qua parent y hệt bẫy #3 nhưng ở chỗ khác: `BookingService.submit()`.**
   `bookingRepository.save(booking)` (booking mới, nhánh `persist()`) chạy trước, rồi mới
   `booking.getAttachments().add(...)`/`getEquipments().add(...)` sau đó — vì flush bị
   hoãn tới cuối transaction, response trả `attachments[].id: null`. Fix: gọi thêm
   `bookingRepository.saveAndFlush(booking)` sau khi gắn xong attachment/equipment,
   ngay trước khi map sang DTO trả về.
10. **URL bị lặp `/api/v1/api/v1` khi ghép URL preview ở frontend.** Backend trả
    `previewUrl()` dạng path đầy đủ (`/api/v1/bookings/{id}/attachments/{aid}/preview?token=...`);
    frontend lại ghép `${API_BASE_URL}${url}` trong khi `API_BASE_URL` đã có sẵn
    `/api/v1`. Fix: thêm `API_ORIGIN` trong `api/client.ts` (chỉ lấy
    protocol+host+port, tự xử lý cả trường hợp `API_BASE_URL` là path tương đối
    `/api/v1` khi chạy qua nginx trong Docker) và dùng `${API_ORIGIN}${url}`.
11. **Spring Security mặc định gửi `X-Frame-Options: DENY` trên MỌI response — kể cả
    endpoint đã `permitAll()`.** Request preview trả 200 đúng nội dung PDF, nhưng
    `<iframe>` hiện trắng vì trình duyệt tự chặn hiển thị (`net::ERR_BLOCKED_BY_RESPONSE`
    trong DevTools, không phải lỗi HTTP). Permit-all trong `authorizeHttpRequests` chỉ
    quyết định ai được GỌI endpoint, không liên quan gì tới header `X-Frame-Options` —
    hai cơ chế độc lập nhau. Fix: tách một `SecurityFilterChain` thứ hai
    (`@Order(1)`, `securityMatcher(PREVIEW_PATH)`) chỉ cho đúng path
    `/api/v1/bookings/*/attachments/*/preview`, tắt `frameOptions` ở đó — an toàn vì
    endpoint này đã được bảo vệ bằng signed token (HMAC, hết hạn sau
    `app.preview-token.ttl-minutes` phút), không phải bằng frame-ancestry.
12. **`@fullcalendar/react` mới nhất (7.1.0) không tương thích với các plugin
    `@fullcalendar/daygrid`/`timegrid`/`list` — các plugin này chưa có bản ổn định 7.x**
    (mới tới `7.0.0-rc.0`), gây lỗi kiểu `tsc -b` kiểu "Type X is missing properties
    ... required in type X" (2 bản `EventImpl` khác nhau từ 2 gói core trùng tên).
    Fix: ghim tất cả `@fullcalendar/*` về cùng bản ổn định mới nhất mà TẤT CẢ gói đều
    có — hiện là `6.1.21`. Khi nâng cấp FullCalendar sau này, luôn `npm ls
    @fullcalendar/core` để chắc chắn chỉ có một phiên bản duy nhất (không bị dedupe
    lỗi hoặc mismatch), và kiểm tra `npm view @fullcalendar/<plugin> versions` cho
    TỪNG gói trước khi ghim version mới.

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

## Việc chưa làm (cố ý, để P2/P3 xử lý)

- **Phiếu mượn/trả phòng** (`handover_slips`/`handover_items` đã có bảng, chưa có
  entity/API): in PDF + QR khi phòng đã APPROVED → cấp phiếu (SLIP_ISSUED) → bàn giao
  (IN_USE) → trả (RETURNED). Đây là P2.
- **Báo cáo/thống kê** (`/reports/usage`) và **audit log** (`audit_logs` đã có bảng,
  chưa ghi gì vào đó) — P2. Khi làm audit log, cân nhắc AOP/interceptor ghi tự động ở
  tầng service thay vì gọi thủ công rải rác từng chỗ.
- **Duyệt đa cấp thật sự** — bảng `approvals.level` đã có sẵn, `BookingService.approve()`
  hiện luôn ghi `level=1` và chuyển thẳng sang APPROVED sau đúng 1 lần duyệt (khớp với
  default `booking.require_approval_levels=1`). Khi làm đa cấp, cần thêm state
  `UNDER_REVIEW` chuyển tiếp giữa các cấp và logic "đã đủ số cấp chưa" — chưa có ở P1.
- Reminder scheduler (`ReminderScheduler`, chạy mỗi 15 phút) mới xử lý
  `REMIND_BEFORE`/`REMIND_RETURN`; chưa có UI xem lịch sử gửi ngoài bảng `email_logs`
  thô — cân nhắc thêm màn hình xem log email ở P2 nếu cần tra soát.
- QR check-in/out, Zalo OA, SSO/AD, digital signage, recurring/waitlist thật sự (P3) —
  xem spec §16. Trong đó **waitlist hiện chỉ là "vẫn chấp nhận nộp đơn khi trùng lịch
  nếu `booking.on_conflict=WAITLIST`"**, không có hàng đợi/tự thông báo khi trống chỗ.
- Bundle frontend production build ~1.7MB (gzip ~540KB) sau khi thêm FullCalendar —
  Vite vẫn cảnh báo "chunk lớn hơn 500KB". Chưa code-split; cân nhắc `dynamic import()`
  cho trang Lịch (`CalendarPublicPage`/`CalendarAdminPage`, nặng nhất) nếu bundle size
  trở thành vấn đề thật.
- Vẫn chưa có test tự động (unit/integration). Logic quan trọng nhất
  (`SchedulingRulesService`, chống trùng lịch) đã được kiểm thử **thủ công đầy đủ**
  qua Docker thật (xem "Kiểm thử đã làm cho P1") nhưng chưa có test tự động hoá lại —
  nên làm sớm ở P2 trước khi thêm nghiệp vụ phiếu mượn/trả (rủi ro hồi quy cao hơn).

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

## Kiểm thử đã làm cho P1 (qua Docker thật + trình duyệt thật, không suy đoán)

**Backend (curl vào `docker compose` thật, port 8090):**
- Nộp đơn công khai chặn đúng khi vi phạm lead-time (400, kèm thời điểm sớm nhất có
  thể chọn), chặn đúng khi trùng lịch với đơn đã APPROVED (409), chấp nhận khi hợp lệ
  và trả về mã đơn `CRMS-YYYY-NNNNNN` sinh đúng thứ tự.
- Upload file kèm đơn: `test.pdf` giả (chỉ đúng magic byte) lưu được nhưng khi xem qua
  trình duyệt báo lỗi PDF hỏng (đúng — vì file giả); PDF thật (convert qua Gotenberg từ
  `.txt`) preview hiển thị đúng nội dung trong iframe.
- Duyệt/từ chối/hủy đơn đổi đúng trạng thái, ghi đúng lịch sử `approvals`; duyệt lại
  đơn đã quyết định bị chặn (400); duyệt đơn trùng giờ với đơn đã APPROVED khác bị chặn
  bởi chính ràng buộc DB (`DataIntegrityViolationException` → 409 thân thiện).
- Gợi ý phòng thay thế trả đúng danh sách phòng còn trống, đủ sức chứa, sắp xếp theo
  sức chứa tăng dần.
- Email: pipeline `@Async` chạy và ghi `email_logs` đúng (status FAILED vì SMTP test
  trỏ vào host giả — đúng hành vi mong đợi, không phải bug).
- Cấu hình: đọc theo nhóm, ghi (PUT) áp dụng ngay cho lần validate tiếp theo; endpoint
  gửi mail thử trả 502 kèm thông báo rõ ràng khi SMTP không tới được (không phải 500).
- Người dùng: tạo tài khoản OFFICER, xác nhận **RBAC hoạt động đúng** — OFFICER bị chặn
  403 ở `/users` (chỉ ADMIN) và ở `/bookings/{id}/approve` (chỉ ADMIN/APPROVER).
- Lịch công khai ẩn đúng tên đơn vị (chỉ hiện "Đã đặt"/"Chờ duyệt"), lịch nội bộ hiện
  đầy đủ; `calendar.ics` sinh đúng định dạng VEVENT.
- Signed URL preview: fetch không kèm header Authorization vẫn trả 200 (đúng thiết kế);
  token bị sửa/giả trả 403.

**Frontend (thao tác thật qua trình duyệt, không phải test giả lập):**
- Luồng đăng ký công khai đầy đủ: vào trang chủ → chọn phòng → điền form (đơn vị,
  người liên hệ, ngày/giờ, thiết bị mượn thêm, upload file) → submit → hiện đúng mã
  đơn vừa sinh → tra cứu lại bằng mã + email đúng thông tin.
- Phát hiện và sửa bug thật: trang công khai gọi nhầm API admin (403) — xem bẫy #8.
- Đăng nhập admin → hàng đợi duyệt đơn hiện đúng 3 đơn với đúng trạng thái/màu →
  vào chi tiết → duyệt một đơn → trạng thái đổi ngay trên UI.
- Xem file đính kèm inline: bấm "Xem" → hiện đúng PDF trong iframe (sau khi sửa bug
  X-Frame-Options — xem bẫy #11); bấm "Tải về" tải file qua blob (vì endpoint tải cần
  JWT, không dùng được `<a href>` trực tiếp).
- Trang Cấu hình: load đúng giá trị hiện tại vào form, lưu thành công, thấy toast xác
  nhận. Trang Người dùng: danh sách đúng, tạo/sửa/đặt lại mật khẩu hoạt động.
- Lịch công khai và lịch nội bộ (FullCalendar) hiển thị đúng tiếng Việt, đúng sự kiện,
  chuyển view tháng/tuần/danh sách mượt.
- Test qua `docker compose` thật ở cổng 8092 sau khi build lại image (không chỉ Vite
  dev server) — xác nhận nginx proxy `/api/` và toàn bộ luồng trên hoạt động y hệt.
