# CLAUDE.md — CRMS-KGU

Hướng dẫn cho Claude Code (và người kế nhiệm) khi làm việc tiếp trên dự án này.
Nguồn sự thật về nghiệp vụ là [`docs/spec.md`](docs/spec.md) — đọc lại file đó trước khi
thay đổi phạm vi hoặc luồng nghiệp vụ.

## Trạng thái hiện tại

**P0 + P1 + P2 — hoàn thành.** P0: CRUD Phòng + tài sản. P1 (MVP đặt phòng): trang công
khai đăng ký mượn phòng (upload văn bản, kiểm tra lead-time/giờ làm việc/ngày lễ, kiểm
tra trùng lịch), trang admin duyệt/từ chối/hủy đơn với xem file đính kèm inline, lịch
công khai + nội bộ (FullCalendar) + feed iCal, email tự động, cấu hình qua UI, quản lý
người dùng (RBAC 3 vai trò), gợi ý phòng thay thế. P2 (phiếu & báo cáo): phiếu mượn/trả
phòng in PDF kèm mã QR (tự nạp CSVC từ phòng, đối chiếu tình trạng khi trả), báo cáo
thống kê (tần suất theo phòng, theo đơn vị, thời gian xử lý trung bình) + xuất Excel,
xuất Excel kiểm kê tài sản theo phòng, nhật ký kiểm toán (audit log) cho các hành động
quan trọng, **duyệt đa cấp thật sự** (đọc `booking.require_approval_levels`, không còn
hardcode 1 cấp). Toàn bộ đã test qua Docker thật + trình duyệt thật, không phải suy đoán
— xem "Kiểm thử đã làm cho P1"/"cho P2" bên dưới.

Chưa làm: P3 (nâng cao — QR check-in thật, Zalo OA, SSO/AD, digital signage, waitlist
thật). Xem "Lộ trình" trong spec §17 và mục "Việc chưa làm" bên dưới.

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
| Lịch | @fullcalendar/{core,react,daygrid,timegrid,list} | 6.1.21 (ghim cứng — xem bẫy #12) |
| PDF phiếu | OpenPDF | 3.0.5 (groupId `com.github.librepdf`, package `org.openpdf.text` — xem bẫy #13) |
| QR code | ZXing (`com.google.zxing:core`/`javase`) | 3.5.4 |
| Excel | Apache POI (`poi-ooxml`) | 5.5.1 |
| CSDL | PostgreSQL | 16 (image chính thức trong docker-compose) |

**Vì sao các phiên bản này:** Spring Initializr's `bootVersion` metadata trả về id
dạng `4.1.1.RELEASE` nhưng artifact thật trên Maven Central là `4.1.1` (không có hậu tố
`.RELEASE` — quy ước đổi từ Boot 3.x). Nếu thấy lỗi
`Non-resolvable parent POM ... 4.x.x.RELEASE`, đó là nguyên nhân — sửa lại version
trong `backend/pom.xml`, đừng đoán ngược lại thêm `.RELEASE`.

**Jackson trong Spring Boot 4 là Jackson 3** (`tools.jackson.*`, groupId `tools.jackson.core`)
— KHÔNG phải Jackson 2 cổ điển (`com.fasterxml.jackson.*`) mà hầu hết tài liệu/code mẫu
trên mạng vẫn giả định. Nếu `@Autowired`/constructor-inject một
`com.fasterxml.jackson.databind.ObjectMapper`, Spring báo "no bean found" dù project rõ
ràng là ứng dụng web — vì Spring chỉ tạo bean `tools.jackson.databind.ObjectMapper`.
`com.fasterxml.jackson.*` chỉ còn tồn tại trong classpath vì `jjwt-jackson` (thư viện
JWT) kéo theo, không liên quan gì tới Spring. Luôn import `tools.jackson.databind.*`
cho bất cứ chỗ nào cần `ObjectMapper`/Jackson API trực tiếp trong code — xem
`AuditService` để có ví dụ đã chạy đúng.

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
│       ├── asset/                # Asset (tài sản/thiết bị trong phòng), CRUD + export Excel kiểm kê
│       ├── booking/              # Booking, BookingAttachment/Equipment, Approval, EquipmentCatalog,
│       │                          # WorkingHours/PublicHoliday, SchedulingRulesService, BookingService
│       │                          # (duyệt đa cấp), ReminderScheduler, PublicBookingController,
│       │                          # BookingController, CalendarController (admin)
│       ├── handover/             # HandoverSlip/HandoverItem, HandoverService (mượn/trả, tự nạp CSVC
│       │                          # từ phòng), HandoverSlipPdfService (OpenPDF), QrCodeGenerator (ZXing)
│       ├── report/                # ReportService (thống kê theo phòng/đơn vị, xuất Excel qua POI)
│       └── audit/                 # AuditLog, AuditService (gọi thủ công tại từng service, không AOP)
│   └── src/main/resources/
│       ├── application.yml
│       ├── fonts/                # DejaVuSans.ttf — nhúng vào PDF để hiện đúng tiếng Việt (OpenPDF
│       │                          # không có font Unicode sẵn); xem HandoverSlipPdfService
│       └── db/migration/        # V1__init, V2__seed, V3__email_templates, V4__booking_reminders
├── frontend/
│   └── src/
│       ├── api/                  # 1 file/domain: rooms, assets, bookings, config, catalog, users,
│       │                          # emailTemplates, handover, reports, audit
│       ├── layouts/              # AdminLayout (sau đăng nhập) và PublicLayout (trang công khai) — tách biệt
│       ├── components/           # HandoverSection.tsx (nhúng vào BookingDetailPage), RequireRole, v.v.
│       └── pages/{public,admin}  # public/ = không cần đăng nhập, admin/ = sau RequireAuth
└── deploy/
    ├── docker-compose.yml       # postgres, gotenberg, backend, frontend(nginx)
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    ├── nginx.conf
    └── .env.example
```

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

### Bẫy đã gặp khi làm P2

13. **OpenPDF đổi package từ `com.lowagie.text` sang `org.openpdf.text` ở bản 3.x.**
    Mọi hướng dẫn/code mẫu OpenPDF trên mạng (kể cả kiến thức huấn luyện của model) đều
    dùng `com.lowagie.text.*` — đúng cho OpenPDF 1.x nhưng bản `3.0.5` (bản mới nhất khi
    làm P2) đã đổi hẳn namespace. Biết được nhờ giải nén jar thật
    (`unzip -l openpdf-3.0.5.jar | grep .class`) thay vì đoán theo tài liệu cũ — luôn
    làm vậy khi thêm một thư viện PDF/report mới, đừng tin blind theo memory.
14. **`ObjectMapper` không tự inject được — xem mục "Jackson trong Spring Boot 4"
    ở bảng Ngăn xếp công nghệ phía trên.** Đây là bẫy quan trọng nhất trong toàn bộ P2:
    lỗi "no bean of type com.fasterxml.jackson.databind.ObjectMapper" xuất hiện ngay ở
    lần khởi động đầu tiên của `AuditService`, dễ khiến người không biết cứ loay hoay
    tìm cách "định nghĩa thêm bean" — trong khi bean ĐÃ có sẵn, chỉ là khác package.
15. **OpenPDF không có font Unicode/tiếng Việt sẵn.** Font mặc định (Helvetica...) chỉ
    có bảng mã Latin cơ bản, chữ có dấu sẽ ra ô trống hoặc ký tự lạ. Đã nhúng
    `DejaVuSans.ttf` (giấy phép tự do, tải từ GitHub release chính thức của dự án
    dejavu-fonts, KHÔNG phải từ repo source — repo source chỉ có file `.sfd` cần build)
    vào `resources/fonts/`, load bằng
    `BaseFont.createFont("DejaVuSans.ttf", IDENTITY_H, EMBEDDED, true, fontBytes, null)`
    (đọc qua `ClassPathResource` thành `byte[]`, không dùng path hệ thống file — để chạy
    đúng cả khi đã đóng gói thành JAR trong container). **Bẫy phụ:** `pdftotext` (xpdf)
    trích xuất ra ký tự `�` lởm cho toàn bộ chữ có dấu dù PDF hiển thị hoàn toàn đúng
    khi mở bằng trình đọc thật (đã xác minh qua PDF.js) — đây là hạn chế của xpdf với
    CMap Identity-H + font nhúng subset, không phải lỗi PDF. Đừng dùng `pdftotext` để
    kiểm tra PDF có tiếng Việt đúng hay chưa; phải mở bằng trình đọc PDF thật.
16. **`@OneToMany(mappedBy=...)` bị "cứng" (stale) trong session sau khi lazy-load lần
    đầu — bẫy tương tự #3/#9 nhưng ở dạng khác.** Trong `BookingService.approve()`,
    code đọc `booking.getApprovals()` để tính `approvedSoFar` (kích hoạt lazy-load lần
    đầu, danh sách rỗng hoặc có N phần tử tại thời điểm đó), rồi tạo `Approval` mới và
    lưu qua `approvalRepository.save(approval)` — persist trực tiếp, đúng cách, không
    sai. Nhưng vì KHÔNG gọi `booking.getApprovals().add(approval)`, khi
    `BookingDto.from(booking)` đọc lại collection đó ở cuối method, Hibernate trả về
    đúng cái danh sách ĐÃ CACHE trong session (từ lần lazy-load đầu), thiếu approval
    vừa thêm — dù dữ liệu trong DB hoàn toàn đúng. Phát hiện được nhờ test kịch bản
    duyệt 2 cấp thật (không phải 1 cấp mặc định) qua UI thật, thấy "Lịch sử duyệt" chỉ
    hiện cấp 1 sau khi đã duyệt cấp 2. Fix: thêm `booking.getApprovals().add(approval)`
    ngay sau khi save, ở cả `approve()` lẫn `reject()`. **Quy tắc chung rút ra:** bất cứ
    khi nào code vừa ĐỌC một collection `@OneToMany` (dù chỉ để đếm/lọc) vừa GHI thêm
    phần tử mới qua repository riêng trong CÙNG method, phải đồng bộ tay vào collection
    in-memory nếu response sau đó còn đọc lại nó — Hibernate không tự làm việc này.
17. **`window.open()` gọi sau `await` bị trình duyệt chặn popup âm thầm** (không throw
    lỗi, không log gì) vì không còn được tính là phản hồi trực tiếp của một cú click.
    Xảy ra ở nút "Xem/in PDF" (`openSlipPdf` trong `api/handover.ts`) — code cũ
    `await fetch(...)` rồi mới `window.open(blobUrl)`. Fix: mở tab trắng
    (`window.open("", "_blank")`) NGAY LẬP TỨC, đồng bộ, trước khi `await` bất cứ gì,
    giữ tham chiếu tab đó, rồi set `tab.location.href = blobUrl` sau khi fetch xong.

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

## Việc chưa làm (cố ý, để P3 xử lý — xem spec §16)

- **QR check-in/out thật** — mã QR trên phiếu hiện chỉ mã hoá số phiếu (`slipNo`) để
  tra cứu thủ công; chưa có luồng "quét QR → tự động chuyển trạng thái" (cần một
  endpoint public-nhưng-có-xác-thực-riêng kiểu chữ ký giống `PreviewTokenService`,
  hoặc một mã QR/token riêng không trùng với số phiếu in trên giấy).
- **Zalo OA, SSO/Active Directory, digital signage** — chưa có dòng code nào, cần hạ
  tầng/thông tin xác thực bên ngoài (Zalo OA app, AD server) mới làm được, không thể tự
  triển khai đầy đủ trong môi trường dev.
- **Waitlist thật sự** — hiện `booking.on_conflict=WAITLIST` chỉ nghĩa là "vẫn chấp
  nhận nộp đơn dù trùng lịch với đơn đã duyệt khác", không có hàng đợi ưu tiên hay tự
  thông báo khi phòng trống trở lại.
- **Đăng ký định kỳ (recurring booking)** — chưa có, mỗi đơn vẫn là một lần đăng ký rời.
- Reminder scheduler (`ReminderScheduler`, chạy mỗi 15 phút) mới gửi email
  `REMIND_BEFORE`/`REMIND_RETURN`; chưa có UI xem lại lịch sử gửi ngoài trang Nhật ký
  kiểm toán (không phải `email_logs` — hai bảng khác nhau, xem "Bẫy" nếu nhầm lẫn).
- Bundle frontend production build ~1.7MB (gzip ~545KB) — Vite vẫn cảnh báo "chunk lớn
  hơn 500KB" do Ant Design + FullCalendar. Chưa code-split; cân nhắc `dynamic import()`
  cho trang Lịch nếu bundle size trở thành vấn đề thật.
- Vẫn chưa có test tự động (unit/integration) cho bất kỳ phase nào. Toàn bộ logic quan
  trọng (chống trùng lịch, duyệt đa cấp, sinh PDF/QR, báo cáo) đã được kiểm thử **thủ
  công đầy đủ** qua Docker thật + trình duyệt thật (xem hai mục "Kiểm thử đã làm" bên
  dưới) nhưng chưa có test tự động — nên làm trước khi tiếp tục thêm tính năng P3, vì
  từ giờ bề mặt code đã đủ lớn để hồi quy âm thầm là rủi ro thật.

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

## Kiểm thử đã làm cho P2 (qua Docker thật + trình duyệt thật, không suy đoán)

**Backend:**
- Lập phiếu mượn cho đơn APPROVED → tự nạp đúng toàn bộ tài sản của phòng (đã thêm 2
  tài sản test vào phòng, phiếu tạo ra đúng 2 dòng với `conditionBefore` lấy đúng từ
  `assets.condition`); booking chuyển đúng sang `SLIP_ISSUED`.
- Lập phiếu trả cho đơn `SLIP_ISSUED` → copy đúng danh sách từ phiếu mượn gần nhất;
  booking chuyển đúng sang `RETURNED`. Thử lập phiếu mượn/trả sai trạng thái (VD lập
  phiếu trả khi chưa có phiếu mượn) bị chặn đúng với thông báo rõ ràng.
- `PATCH /slips/{id}/items` ghi đúng `conditionAfter`/`note` cho từng dòng, chuyển
  slip sang `COMPLETED`. `POST /bookings/{id}/close` chỉ cho phép từ `RETURNED`, gọi
  lại lần 2 bị chặn (400) đúng như spec.
- **PDF phiếu mượn/trả**: sinh ra file PDF hợp lệ (xác minh bằng `file` — "PDF document,
  version 2.0"), mở qua PDF.js trong trình duyệt để xem trực quan — chữ tiếng Việt có
  dấu, tiêu đề, bảng CSVC, mã QR đều hiển thị đúng hoàn toàn. Phát hiện `pdftotext`
  (xpdf) trích xuất text bị lỗi `�` dù hiển thị đúng — xác định đây là hạn chế công cụ
  trích xuất (CMap Identity-H), không phải lỗi PDF thật, bằng cách so sánh với kết quả
  hiển thị thật qua PDF.js.
- **Duyệt đa cấp**: đặt `booking.require_approval_levels=2`, duyệt lần 1 → đúng
  `UNDER_REVIEW` (chưa APPROVED), duyệt lần 2 (có thể bởi người duyệt khác) → đúng
  `APPROVED`, lịch sử duyệt (`approvals`) hiện đủ cả 2 cấp với đúng comment mỗi cấp
  (sau khi sửa bẫy #16 — trước đó cấp 2 bị thiếu trong response dù đã lưu đúng vào DB).
- **Báo cáo**: `/reports/usage` tổng hợp đúng số đơn/giờ sử dụng theo phòng, tỷ lệ
  duyệt theo đơn vị, thời gian xử lý trung bình — đối chiếu tay với dữ liệu test đã
  biết trước, khớp chính xác. Xuất Excel (báo cáo dùng phòng + kiểm kê tài sản theo
  phòng) trả đúng `Content-Type` của `.xlsx`.
- **Audit log**: mọi hành động duyệt/từ chối/hủy/đóng đơn, lập phiếu mượn/trả đều ghi
  đúng `action`, `entity`, `entityId`, `detail` (JSON), và `ip` (lấy đúng
  `X-Forwarded-For` khi có, fallback về `remoteAddr`). Chỉ ADMIN truy cập được
  `/audit-logs` — OFFICER/APPROVER bị 403 (đã kiểm bằng RBAC test tương tự P1).

**Frontend:**
- `HandoverSection` (nhúng trong trang chi tiết đơn) hiện đúng nút theo trạng thái đơn
  (Lập phiếu mượn khi APPROVED, Lập phiếu trả khi SLIP_ISSUED, ẩn cả hai khi đã có đủ
  phiếu) — test qua thao tác thật: điền form, submit, thấy toast + slip mới xuất hiện
  ngay không cần tải lại trang.
- Nút "Xem/in PDF" gọi đúng endpoint (network request 200 xác nhận), phát hiện và sửa
  bẫy #17 (popup bị chặn) — xác minh fetch thành công qua network log dù không thể xác
  nhận trực quan tab mới mở được do giới hạn sandbox của công cụ test trình duyệt
  (không phải hành vi của trình duyệt thật).
- Trang Báo cáo: chọn khoảng ngày, số liệu tổng quan + hai bảng (theo phòng, theo đơn
  vị) hiển thị đúng khớp với dữ liệu đã tạo trong lúc test backend.
- Trang Nhật ký kiểm toán: danh sách hiện đúng toàn bộ audit log đã ghi, đúng thứ tự
  thời gian, chi tiết JSON đọc được.
- Test lại toàn bộ qua `docker compose` thật ở cổng 8092 (build lại image sau khi xong
  code) — không chỉ Vite dev server.
