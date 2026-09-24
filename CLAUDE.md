# CLAUDE.md — CRMS-KGU

Hướng dẫn cho Claude Code (và người kế nhiệm) khi làm việc tiếp trên dự án này.
Nguồn sự thật về nghiệp vụ là [`docs/spec.md`](docs/spec.md) — đọc lại file đó trước khi
thay đổi phạm vi hoặc luồng nghiệp vụ.

## Trạng thái hiện tại

**P0 + P1 + P2 + phần lớn P3 — hoàn thành.** P0: CRUD Phòng + tài sản. P1 (MVP đặt
phòng): trang công khai đăng ký mượn phòng (upload văn bản, kiểm tra lead-time/giờ làm
việc/ngày lễ, kiểm tra trùng lịch), trang admin duyệt/từ chối/hủy đơn với xem file đính
kèm inline, lịch công khai + nội bộ (FullCalendar) + feed iCal, email tự động, cấu hình
qua UI, quản lý người dùng (RBAC 3 vai trò), gợi ý phòng thay thế. P2 (phiếu & báo cáo):
phiếu mượn/trả phòng in PDF kèm mã QR (tự nạp CSVC từ phòng, đối chiếu tình trạng khi
trả), báo cáo thống kê + xuất Excel, xuất Excel kiểm kê tài sản theo phòng, nhật ký kiểm
toán, **duyệt đa cấp thật sự**. P3 (nâng cao, xem spec §16): **QR check-in/out thật**
(quét mã trên phiếu mượn → booking tự chuyển `IN_USE` — lần đầu tiên trạng thái này
được dùng thật; xem bẫy #18), **waitlist thật sự** (bảng `waitlist_entries` riêng, tự
gửi email khi đơn đang chiếm chỗ bị hủy — không còn "vẫn nhận đơn dù trùng lịch" như P1),
**đăng ký định kỳ** (lặp lại hàng tuần, mỗi lần lặp là một booking độc lập, tự chia
CREATED/WAITLISTED/REJECTED theo từng lần), và **màn hình signage** (`/man-hinh`, public,
tự làm mới, không có trong `PublicLayout`). Toàn bộ đã test qua Docker thật + trình
duyệt thật, không phải suy đoán — xem các mục "Kiểm thử đã làm cho P1/P2/P3" bên dưới.

**Sau P3 (chưa gắn số phase, xem "Giao diện" và "Tạo đơn thủ công & lịch nâng cao" bên
dưới):** thiết kế lại giao diện 2 lần theo phản hồi người dùng (ornate → tối giản kiểu
Material), trang chủ công khai chuyển sang nội dung admin-editable (carousel ảnh full-
bleed 16:9 + text qua `configurations`), **staff tạo đơn thủ công** (`source=INTERNAL`,
lần đầu tiên cột này được dùng thật kể từ P0), và lịch (cả công khai lẫn nội bộ) có
thêm view ngày, hover xem nhanh, bấm xem chi tiết (modal cho công khai, điều hướng cho
nội bộ), và chế độ xem dạng bảng.

Chưa làm (P3 phần còn lại, cần hạ tầng ngoài không có ở môi trường dev): Zalo OA,
SSO/Active Directory, lắp màn hình signage vật lý ngoài cửa phòng (trang web đã có, chỉ
thiếu phần cứng/vận hành thực tế). Xem "Lộ trình" trong spec §17 và mục "Việc chưa làm"
bên dưới.

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
│       │                          # từ phòng), HandoverSlipPdfService (OpenPDF), QrCodeGenerator (ZXing),
│       │                          # HandoverConfirmTokenService + HandoverConfirmController (QR check-in/out)
│       ├── report/                # ReportService (thống kê theo phòng/đơn vị, xuất Excel qua POI)
│       ├── audit/                 # AuditLog, AuditService (gọi thủ công tại từng service, không AOP)
│       ├── waitlist/              # WaitlistEntry, WaitlistService (hàng chờ + tự báo khi trống)
│       └── landing/               # LandingSlide (ảnh carousel trang chủ, top-level — không gắn với
│                                    # phòng nào) + LandingSlideController (admin) + PublicLandingController
│   └── src/main/resources/
│       ├── application.yml
│       ├── fonts/                # DejaVuSans.ttf — nhúng vào PDF để hiện đúng tiếng Việt (OpenPDF
│       │                          # không có font Unicode sẵn); xem HandoverSlipPdfService
│       └── db/migration/        # V1__init, V2__seed, V3__email_templates, V4__booking_reminders,
│                                  # V5__p3_qr_checkin_waitlist_recurrence,
│                                  # V6__landing_content (bảng landing_slides + config group 'landing')
├── frontend/
│   └── src/
│       ├── theme.ts               # AntD ThemeConfig — hex phải khớp tay với index.css (xem dưới)
│       ├── index.css              # Design tokens (CSS custom properties, nền sáng/một màu nhấn) +
│       │                          # .crms-* utility classes (plaque/chip/eyebrow) — đọc header comment
│       │                          # trong file trước khi đổi màu/font; xem mục "Giao diện" bên dưới
│       ├── api/                  # 1 file/domain: rooms, assets, bookings, config, catalog, users,
│       │                          # emailTemplates, handover, reports, audit, waitlist, landing
│       ├── layouts/              # AdminLayout (sau đăng nhập) và PublicLayout (trang công khai) — tách biệt
│       ├── components/           # HandoverSection.tsx (nhúng vào BookingDetailPage), RoomPlaqueCard.tsx
│       │                          # (thẻ phòng dùng chung 3 trang public), RequireRole, v.v.
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

### Bẫy đã gặp khi làm P3

18. **QR check-in/out ở P2 chỉ mã hoá `slipNo` — không xác nhận được gì thật.** Quét mã
    ra một chuỗi số phiếu, không có hành động nào chạy khi quét. Fix thật: QR giờ mã hoá
    một URL công khai ký HMAC (`HandoverConfirmTokenService`, giống hệt pattern của
    `PreviewTokenService` — token riêng, TTL riêng theo ngày chứ không theo phút, vì
    phiếu in giấy có thể bị quét bất cứ lúc nào trong suốt vòng đời mượn/trả, không phải
    vài phút như link preview). **Bẫy phụ quan trọng:** hai loại phiếu (BORROW/RETURN)
    KHÔNG đối xứng khi confirm. Phiếu mượn tạo xong chỉ chuyển booking sang
    `SLIP_ISSUED` (chưa `IN_USE`) — quét QR xác nhận mới thật sự chuyển sang `IN_USE`,
    đây là lần đầu trạng thái này được dùng trong toàn bộ hệ thống kể từ khi định nghĩa
    ở P0/P1. Còn phiếu trả đã tự chuyển booking sang `RETURNED` ngay khi TẠO phiếu (hành
    vi P2 cũ, đã test kỹ, không đổi) — nên quét QR ở phiếu trả không chuyển trạng thái gì
    thêm, chỉ ghi `confirmed_at`/`confirmed_ip` làm bằng chứng đã quét thật tại chỗ. Nếu
    sau này ai đó "sửa cho đối xứng" bằng cách trì hoãn `RETURNED` tới lúc quét QUÉT, phải
    kiểm tra lại toàn bộ luồng nghiệm thu (`BookingService.close()`, nút "Nghiệm thu" ở
    `BookingDetailPage`) vì chúng đang giả định `RETURNED` đã xảy ra ngay khi có phiếu.
19. **`no_overlap_per_room` (EXCLUDE constraint) chỉ áp dụng cho `status='APPROVED'`
    — nghĩa là việc lặp một vòng lặp `submit()` nhiều lần trong CÙNG MỘT transaction
    (đăng ký định kỳ) an toàn hơn tưởng tượng ban đầu.** Lo ngại đầu tiên khi làm
    recurring booking: nếu một lần lặp trong vòng lặp bị `DataIntegrityViolationException`
    từ constraint DB, Postgres sẽ "abort" toàn bộ transaction hiện tại (lỗi kiểu "current
    transaction is aborted, commands ignored until end of transaction block"), khiến các
    lần lặp SAU đó cũng fail dù code Java có catch exception. Nhưng vì booking mới luôn
    tạo với status `SUBMITTED` (không phải `APPROVED`), INSERT của nó không bao giờ chạm
    tới constraint này — constraint chỉ kích hoạt ở `BookingService.approve()`. Kết luận:
    vòng lặp nhiều `submit()` trong 1 transaction AN TOÀN với thiết kế hiện tại, nhưng
    nếu sau này approve() được gọi hàng loạt trong 1 transaction (chưa có, nhưng có thể
    bị thêm nhầm), phải tách transaction riêng cho từng approve hoặc chấp nhận rollback
    toàn bộ khi một cái xung đột.
20. **`booking.on_conflict=WAITLIST` ở P1 KHÔNG phải waitlist thật — chỉ là "vẫn nhận
    đơn dù trùng lịch".** Hai đơn `SUBMITTED` cùng giờ cùng phòng trông y hệt nhau trong
    hàng đợi duyệt; ai duyệt trước thắng (nhờ constraint DB chặn ở bước approve), người
    duyệt sau chỉ thấy lỗi 409 chung chung, không biết trước là mình sắp thua. Fix: tách
    hẳn một bảng `waitlist_entries` — khi trùng lịch với một đơn ĐÃ APPROVED (không phải
    trùng với đơn SUBMITTED khác) và cấu hình là WAITLIST, không tạo Booking cạnh tranh
    nữa mà tạo một `WaitlistEntry` (không có state machine phức tạp, không cạnh tranh
    duyệt). Khi đơn đang chiếm chỗ bị HỦY (chỉ hủy mới tính — đơn REJECTED chưa từng
    APPROVED nên chưa từng thật sự chiếm chỗ), tự động email mọi entry đang WAITING
    trùng khung giờ, chuyển sang NOTIFIED. Cố tình KHÔNG tự tạo booking hộ người chờ khi
    trống — "tự báo khi trống" trong đặc tả nghĩa là auto-notify, không phải auto-book,
    vì thông tin họ nhập lúc chờ có thể đã lỗi thời (đổi số người, đổi mục đích...).

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

## Giao diện (design system)

Frontend ban đầu (P0-P3) dùng nguyên màu/font mặc định của AntD — người dùng chê "quá
đơn giản". Thử một hệ nhận diện ornate tên "Bảng tên phòng / con dấu" (navy + đồng +
serif Fraunces + con dấu xoay nghiêng khi duyệt đơn) — người dùng chê tiếp là "lố lăng".
**Bản hiện tại (mới nhất) đi theo hướng ngược lại: sạch, hiện đại, tối giản, kiểu
Material** — nền trắng/xám nhạt, MỘT màu nhấn (xanh lá), không gradient/hoạ tiết/con
dấu, một font sans duy nhất. Nếu định "làm đẹp thêm" lần nữa, đọc kỹ hai lần thất bại ở
trên trước — đừng quay lại hướng ornate.

- **Token màu/font**: định nghĩa MỘT LẦN ở `frontend/src/index.css` (CSS custom
  properties: `--ink-*` chữ đậm/tiêu đề — xám gần đen, không phải navy nữa; `--primary-*`
  xanh lá — màu hành động chính, duy nhất; `--danger-*` đỏ lỗi/từ chối; `--surface`
  trắng, `--bg` nền trang xám rất nhạt, `--border` viền xám nhạt) và lặp lại bằng tay ở
  `frontend/src/theme.ts` (AntD `ThemeConfig`, không đọc được CSS var). **Đổi màu ở một
  chỗ mà quên chỗ kia sẽ lệch theme** — luôn sửa cả hai file cùng lúc.
- **Font**: chỉ Be Vietnam Pro (font người Việt thiết kế, đủ dấu tiếng Việt) cho toàn bộ
  chữ — heading chỉ đậm hơn (weight 700), không dùng serif/italic nào nữa. JetBrains
  Mono giữ lại riêng cho mã đơn/mã phòng (`.crms-mono`, `.crms-plaque-code`). Nạp qua
  Google Fonts `<link>` trong `index.html`.
- **`.crms-plaque`** (index.css): thẻ phòng phẳng, nền trắng, viền + bóng đổ nhẹ kiểu
  Material elevation, KHÔNG còn khối nền tối + chữ khắc lớn — ảnh đại diện trống thì
  hiện một icon đơn giản trên nền xanh nhạt. Dùng qua component dùng chung
  `RoomPlaqueCard.tsx` ở cả 3 trang public (Landing, RoomsPublicPage,
  RoomDetailPublicPage) — sửa 1 nơi, khỏi lặp code.
- **`.crms-chip`**: badge nhỏ dạng viên thuốc (pill), thay hẳn cho con dấu xoay nghiêng
  cũ — hiện cạnh tiêu đề trang chi tiết đơn khi đơn đã **APPROVED** (và mọi trạng thái kế
  thừa: SLIP_ISSUED/IN_USE/RETURNED/CLOSED) hoặc **REJECTED**. Class `crms-chip-enter`
  chỉ gắn thêm đúng một lần, ngay sau khi `approveMutation`/`rejectMutation` thành công
  trong CÙNG phiên thao tác (state `justStamped` ở `BookingDetailPage.tsx`) — tải lại
  trang một đơn đã duyệt từ trước chỉ hiện chip tĩnh, không animate lại.
- **Trang signage (`/man-hinh`) vẫn nền tối** (`SignagePage.tsx`, màu hex viết thẳng,
  không dùng token) — CỐ Ý khác biệt, vì đây là màn hình TV treo tường cần tương phản
  cao nhìn từ xa, không phải một trang web thường; đừng "đồng bộ hoá" nó về nền trắng.
- Tôn trọng `prefers-reduced-motion: reduce` (tắt hết animation/transition) — xem cuối
  `index.css`.
- **Nội dung trang chủ công khai không còn hardcode trong frontend.** Carousel ảnh đầu
  trang (full-bleed, tỷ lệ 16:9 — AntD `Carousel`, xem `.crms-hero-carousel` trong
  `index.css` để hiểu vì sao cần ép `height: 100%` xuyên suốt chuỗi `.slick-*`, react-
  slick không tự giãn theo container cha) lấy dữ liệu từ bảng `landing_slides` riêng,
  quản lý ở trang admin **Nội dung trang chủ** (`LandingContentPage.tsx`, giống hệt
  cách quản lý ảnh phòng — dán URL, không có upload file). Dòng chữ nhỏ/tiêu đề/mô tả
  dưới carousel nằm trong `configurations` (group mới `landing`, đọc/ghi qua chính
  `ConfigPage.tsx` có sẵn — không cần trang riêng). Cả hai gộp lại qua một endpoint công
  khai duy nhất `GET /api/v1/public/landing`. **Không seed ảnh mẫu nào** — toàn bộ
  phòng trong `V2__seed.sql` vốn đã không có `thumbnail_url` thật, thêm ảnh stock giả
  vào đây sẽ trông như nội dung thật của trường trong khi không phải; carousel rỗng thì
  hiện một ô nền xanh nhạt + icon đơn giản, chờ admin tự thêm ảnh thật.

## Tạo đơn thủ công & lịch nâng cao

- **`POST /api/v1/bookings` (staff tạo đơn thủ công)** — dùng khi một đơn vị gọi điện
  hoặc đến trực tiếp thay vì tự đăng ký qua cổng công khai. Cột `bookings.source`
  (PUBLIC/INTERNAL) có sẵn từ `V1__init.sql` nhưng chưa từng có gì ghi `INTERNAL` cho
  tới bây giờ. Cài đặt bằng cách tách `BookingService.submit()` thành
  `submitWithSource(request, files, source)` dùng chung cho cả `submit()` (source=
  PUBLIC, endpoint công khai) và `createInternal()` (source=INTERNAL, endpoint admin,
  mở cho MỌI role đã đăng nhập — không riêng ADMIN, vì OFFICER cũng cần dùng).
  **Quyết định cố ý, không phải thiếu sót:** đơn tạo thủ công KHÔNG tự động duyệt —
  vẫn vào đúng hàng đợi `SUBMITTED` và cần bấm "Duyệt đơn" như một đơn công khai bình
  thường (kể cả khi người tạo là ADMIN). Lý do: OFFICER — người đối tượng chính của
  tính năng này — không bao giờ được phép tự duyệt đơn (RBAC hiện tại), nên nếu để
  ADMIN tự động duyệt còn OFFICER thì không, hành vi sẽ khác nhau tùy ai bấm nút, rất
  dễ gây nhầm lẫn. Nếu sau này có người muốn "tạo xong duyệt luôn cho nhanh", đó là một
  cú click Duyệt riêng ngay sau khi tạo, không phải lý do để đổi lại thiết kế này. Đơn
  tạo thủ công vẫn chạy qua đúng `SchedulingRulesService` (lead-time, giờ làm việc) và
  đúng cơ chế chống trùng lịch/waitlist như đơn công khai — không có đường tắt bỏ qua
  quy tắc nào cả.
- **Lịch (cả `/calendar` công khai lẫn `/admin/calendar` nội bộ) thêm 3 thứ cùng lúc:**
  view **ngày** (`timeGridDay`, trước đây chỉ có tháng/tuần/danh sách), **hover xem
  nhanh** (tooltip nổi tự vẽ bằng `eventMouseEnter`/`eventMouseLeave` của FullCalendar —
  chú ý type đúng là `EventHoveringArg` cho CẢ HAI callback, không phải hai type
  `EventMouseEnterArg`/`EventMouseLeaveArg` tưởng tượng, FullCalendar v6 chỉ có một type
  chung), và **chế độ xem dạng bảng** (AntD `Segmented` chuyển đổi, dùng lại NGUYÊN
  mảng `events` đã fetch theo range hiện tại của lịch — không gọi API riêng). Lịch công
  khai trước đây hoàn toàn không bấm được (không `eventClick`); giờ bấm vào mở
  `Modal` hiện đúng 3 trường đã che (phòng/giờ/trạng thái dạng "Đã đặt"/"Chờ duyệt"),
  KHÔNG điều hướng đi đâu (không có trang chi tiết công khai, và không nên có). Lịch
  nội bộ vẫn giữ nguyên hành vi bấm-là-điều-hướng-sang-trang-chi-tiết đã có từ P1,
  chỉ thêm hover/bảng/view ngày. `CalendarEventDto.from()` (nội bộ) đặt `title =
  requesterUnit` — đây là lý do tooltip/bảng nội bộ hiện được tên đơn vị mà không cần
  sửa gì ở backend.

## Việc chưa làm (cố ý — cần hạ tầng ngoài không có ở môi trường dev)

- **Zalo OA, SSO/Active Directory** — chưa có dòng code nào, cần thông tin xác thực bên
  ngoài (Zalo OA app đã đăng ký, AD server thật của trường) mới làm được, không thể tự
  triển khai đầy đủ trong môi trường dev. Nếu làm sau: Zalo OA có thể theo đúng pattern
  của `MailService` (một "kênh gửi" song song, cùng bảng log kiểu `email_logs`); SSO/AD
  cần thêm `AuthenticationProvider` mới bên cạnh `DaoAuthenticationProvider` hiện tại
  trong `SecurityConfig`, ánh xạ nhóm AD sang 3 role hiện có.
- **Màn hình signage vật lý ngoài cửa phòng** — trang web `/man-hinh` đã có (P3, public,
  tự làm mới mỗi 30s, xem "Kiểm thử đã làm cho P3"), chỉ còn thiếu phần lắp đặt/vận hành
  thực tế (mua màn hình, mount ngoài cửa từng phòng, trỏ trình duyệt kiosk vào URL) —
  không phải việc của code nữa.
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

## Kiểm thử đã làm cho P3 (qua Docker thật + trình duyệt thật, không suy đoán)

**Backend (curl vào `docker compose` thật, port 8090):**
- **Waitlist thật**: đặt `booking.on_conflict=WAITLIST`, nộp đơn trùng giờ với một đơn
  đã APPROVED → đúng trả về `waitlisted:true` kèm `WaitlistEntryDto` (KHÔNG tạo Booking
  cạnh tranh), status `WAITING`. Hủy đơn đang APPROVED chiếm chỗ → xác minh qua
  `GET /waitlist` entry chuyển đúng sang `NOTIFIED` kèm `notifiedAt`; `email_logs` ghi
  đúng một dòng `WAITLIST_FREED` gửi tới đúng email người chờ (status FAILED vì SMTP
  test giả — đúng hành vi mong đợi, giống mọi email khác trong dự án này).
- **Đăng ký định kỳ**: nộp 1 đơn với `repeatWeeks=4` → tạo đúng 4 booking độc lập, cùng
  `recurrenceGroup` (UUID), lệch nhau đúng 7 ngày, mỗi đơn có mã (`code`) riêng và
  `outcome=CREATED` riêng trong response.
- **QR check-in/out thật**: tạo phiếu mượn cho đơn APPROVED → response có `confirmUrl`
  trỏ đúng về `PUBLIC_BASE_URL` (khác `API_BASE_URL`, đã kiểm tra không bị lặp
  `/api/v1`). Gọi `GET` rồi `POST` `/public/handover-confirm/{id}?token=...` (không kèm
  header Authorization, mô phỏng đúng một điện thoại vừa quét QR) → đơn chuyển đúng từ
  `SLIP_ISSUED` sang `IN_USE` (lần đầu tiên trạng thái này thật sự được set trong toàn
  bộ hệ thống). Gọi `POST` lần 2 (xác nhận lại) → trả về `alreadyConfirmed:true`, không
  lỗi, không đổi trạng thái thêm lần nữa (idempotent). Gọi với token bị sửa (`bad.token`)
  → đúng 403.
- **Digital signage**: `GET /public/signage` trả đúng danh sách toàn bộ 11 phòng ACTIVE
  thật của KGU, đúng `occupied`/`occupiedUntil`/`nextStart` tính từ dữ liệu booking thật
  đang có trong DB tại thời điểm gọi.

**Frontend (thao tác thật qua trình duyệt, không phải test giả lập):**
- Trang công khai `/booking/new`: tick "Lặp lại hàng tuần" → đúng hiện thêm ô "Số tuần
  lặp lại" (mặc định 4, ẩn/hiện theo `Form.Item shouldUpdate`); nộp đơn thường vẫn ra
  đúng màn hình thành công như P1/P2 (không đổi hành vi mặc định).
- Trang xác nhận QR `/xac-nhan-phieu/:slipId?token=...` (đứng riêng, không có
  `PublicLayout`): mở đúng bằng `confirmUrl` lấy từ API thật, hiện đúng "Đã xác nhận"
  kèm thời điểm khi slip đã được xác nhận trước đó qua API.
- Màn hình signage `/man-hinh` (đứng riêng, nền tối, chữ lớn, không có `PublicLayout`):
  hiện đúng toàn bộ 11 phòng thật, đúng trạng thái TRỐNG/ĐANG HỌP, đồng hồ chạy thật.
- Trang admin "Danh sách chờ" (`/admin/waitlist`, menu mới trong `AdminLayout`): mặc
  định lọc `WAITING` (xác nhận qua network log gọi đúng
  `GET /waitlist?status=WAITING`); đổi filter sang `NOTIFIED` qua gọi thẳng API bằng
  JWT lấy từ `localStorage` (do công cụ test trình duyệt gặp giới hạn thao tác với
  AntD `Select` trong phiên này) — xác nhận entry đã chuyển đúng trạng thái và dữ liệu
  khớp với những gì test backend vừa tạo.
- `HandoverSection` (trang chi tiết đơn): nút mới "Sao chép link xác nhận" và tag
  "Đã xác nhận lúc .../Chưa quét QR xác nhận" hiển thị đúng theo `confirmedAt` của slip.
- Test lại toàn bộ qua `docker compose` thật ở cổng 8092 sau khi build lại image (không
  chỉ Vite dev server) — Flyway áp dụng đúng `V5__p3_qr_checkin_waitlist_recurrence.sql`
  khi khởi động (log xác nhận "Successfully applied 1 migration ... now at version v5").

## Kiểm thử đã làm cho "Tạo đơn thủ công & lịch nâng cao" (qua Docker thật + trình duyệt thật)

**Backend (curl, port 8090):**
- ADMIN gọi `POST /bookings` → tạo đúng đơn `source=INTERNAL`, `status=SUBMITTED`
  (không tự duyệt), ghi đúng audit log `BOOKING_CREATE_INTERNAL` kèm `entityId`.
- Đăng nhập bằng tài khoản `officer1` (role OFFICER) thật đã có sẵn trong seed data →
  gọi `POST /bookings` thành công (201, `source=INTERNAL`) → gọi tiếp
  `POST /bookings/{id}/approve` bằng CHÍNH tài khoản OFFICER đó → đúng 403, xác nhận
  OFFICER tạo được đơn nhưng vẫn không tự duyệt được đơn mình vừa tạo.
- Duyệt một đơn nội bộ cho có phòng/giờ đã bị chiếm, sau đó thử tạo tiếp một đơn nội bộ
  khác trùng đúng khung giờ đó → đúng 409, xác nhận ràng buộc chống trùng lịch áp dụng
  cho đơn tạo thủ công y hệt đơn công khai, không có đường tắt.

**Frontend (thao tác thật qua trình duyệt, không phải test giả lập):**
- Trang `/admin/bookings`: nút "Tạo đơn mới" mới thêm ở góc phải hiện đúng, dẫn đúng
  tới `/admin/bookings/new`.
- Điền và nộp toàn bộ form tạo đơn thủ công qua thao tác chuột/bàn phím thật (chọn
  phòng qua dropdown, gõ ngày/giờ, không phải chỉ set giá trị bằng script) → nhận đúng
  màn hình "Đã tạo đơn" kèm mã đơn thật → bấm "Xem chi tiết đơn" → điều hướng đúng tới
  trang chi tiết, thấy đúng nút Duyệt/Từ chối vẫn hiện ra (đúng vì chưa tự duyệt).
- Lịch nội bộ (`/admin/calendar`): chuyển view tháng thấy đúng dữ liệu thật đã seed;
  di chuột vào một sự kiện hiện đúng tooltip nổi (tên phòng, tên đơn vị, khung giờ,
  tag trạng thái); chuyển sang "Bảng" hiện đúng bảng với dữ liệu giống hệt lịch, bấm
  vào một dòng điều hướng đúng sang trang chi tiết đơn.
- Lịch công khai (`/calendar`): tooltip khi hover đúng KHÔNG hiện tên đơn vị (chỉ "Đã
  đặt"/"Chờ duyệt"), đúng nguyên tắc ẩn danh đã có từ P1; bấm vào sự kiện mở đúng modal
  "Chi tiết lịch" tại chỗ (không điều hướng đi đâu, không có trang riêng lộ thêm dữ
  liệu); view ngày mới thêm hiển thị đúng trong cả hai lịch.
