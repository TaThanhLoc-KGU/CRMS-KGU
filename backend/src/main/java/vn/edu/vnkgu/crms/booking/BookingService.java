package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.booking.dto.BookingDto;
import vn.edu.vnkgu.crms.booking.dto.CalendarEventDto;
import vn.edu.vnkgu.crms.booking.dto.BookingEquipmentRequest;
import vn.edu.vnkgu.crms.booking.dto.BookingPublicStatusDto;
import vn.edu.vnkgu.crms.booking.dto.BookingSubmitRequest;
import vn.edu.vnkgu.crms.booking.dto.BookingSummaryDto;
import vn.edu.vnkgu.crms.booking.dto.RoomSuggestionDto;
import vn.edu.vnkgu.crms.audit.AuditService;
import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.common.ConflictException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.common.preview.PreviewConversionService;
import vn.edu.vnkgu.crms.common.storage.FileValidator;
import vn.edu.vnkgu.crms.common.storage.StorageService;
import vn.edu.vnkgu.crms.common.storage.StoredFile;
import vn.edu.vnkgu.crms.config.domain.ConfigService;
import vn.edu.vnkgu.crms.mail.MailService;
import vn.edu.vnkgu.crms.room.Room;
import vn.edu.vnkgu.crms.room.RoomRepository;
import vn.edu.vnkgu.crms.room.RoomStatus;
import vn.edu.vnkgu.crms.room.SetupStyle;
import vn.edu.vnkgu.crms.room.SetupStyleRepository;
import vn.edu.vnkgu.crms.security.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final DateTimeFormatter MAIL_TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final Set<BookingStatus> DECIDABLE = Set.of(BookingStatus.SUBMITTED, BookingStatus.UNDER_REVIEW);
    private static final Set<BookingStatus> CANCELLABLE =
            Set.of(BookingStatus.SUBMITTED, BookingStatus.UNDER_REVIEW, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final SetupStyleRepository setupStyleRepository;
    private final EquipmentCatalogRepository equipmentCatalogRepository;
    private final ApprovalRepository approvalRepository;
    private final BookingCodeGenerator codeGenerator;
    private final SchedulingRulesService schedulingRulesService;
    private final ConfigService configService;
    private final StorageService storageService;
    private final FileValidator fileValidator;
    private final PreviewConversionService previewConversionService;
    private final MailService mailService;
    private final AuditService auditService;

    public BookingService(BookingRepository bookingRepository, RoomRepository roomRepository,
                           SetupStyleRepository setupStyleRepository,
                           EquipmentCatalogRepository equipmentCatalogRepository,
                           ApprovalRepository approvalRepository, BookingCodeGenerator codeGenerator,
                           SchedulingRulesService schedulingRulesService, ConfigService configService,
                           StorageService storageService, FileValidator fileValidator,
                           PreviewConversionService previewConversionService, MailService mailService,
                           AuditService auditService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.setupStyleRepository = setupStyleRepository;
        this.equipmentCatalogRepository = equipmentCatalogRepository;
        this.approvalRepository = approvalRepository;
        this.codeGenerator = codeGenerator;
        this.schedulingRulesService = schedulingRulesService;
        this.configService = configService;
        this.auditService = auditService;
        this.storageService = storageService;
        this.fileValidator = fileValidator;
        this.previewConversionService = previewConversionService;
        this.mailService = mailService;
    }

    @Transactional
    public BookingDto submit(BookingSubmitRequest request, List<MultipartFile> files) {
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> NotFoundException.of("Phòng", request.roomId()));
        if (room.getStatus() != RoomStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phòng hiện không nhận đặt (đang bảo trì/ngừng sử dụng)");
        }
        if (!configService.getBoolean("booking.allow_public_submit", true)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Hệ thống tạm ngừng nhận đăng ký công khai");
        }

        schedulingRulesService.validate(room, request.startTime(), request.endTime());
        checkConflict(room.getId(), request.startTime(), request.endTime());

        SetupStyle setupStyle = null;
        if (request.setupStyleId() != null) {
            setupStyle = setupStyleRepository.findById(request.setupStyleId())
                    .orElseThrow(() -> NotFoundException.of("Kiểu bố trí", request.setupStyleId()));
        }

        Booking booking = new Booking();
        booking.setCode(generateUniqueCode());
        booking.setRoom(room);
        booking.setSetupStyle(setupStyle);
        booking.setRequesterUnit(request.requesterUnit());
        booking.setContactName(request.contactName());
        booking.setContactEmail(request.contactEmail());
        booking.setContactPhone(request.contactPhone());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setExpectedAttendees(request.expectedAttendees());
        booking.setPurpose(request.purpose());
        booking.setExtraRequirements(request.extraRequirements());
        booking.setStatus(BookingStatus.SUBMITTED);
        booking.setSource(BookingSource.PUBLIC);
        bookingRepository.save(booking);

        attachEquipment(booking, request.equipmentItems());
        attachFiles(booking, files);
        // Flush so the cascade-persisted equipment/attachment rows get their IDENTITY-
        // generated ids before BookingDto.from() reads them — Hibernate would otherwise
        // defer those INSERTs to commit time, after this method has already returned.
        bookingRepository.saveAndFlush(booking);

        mailService.sendTemplateAsync("RECEIVED", booking.getContactEmail(), mailVariables(booking), booking.getId());
        return BookingDto.from(booking);
    }

    public BookingPublicStatusDto lookupPublic(String code, String email) {
        Booking booking = bookingRepository.findByCodeAndContactEmailIgnoreCase(code, email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn với mã và email đã nhập"));
        return BookingPublicStatusDto.from(booking);
    }

    public Page<BookingSummaryDto> listAdmin(BookingStatus status, Long roomId, String unit, Instant from, Instant to,
                                              Pageable pageable) {
        Specification<Booking> spec = Specification.allOf();
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (roomId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("room").get("id"), roomId));
        }
        if (unit != null && !unit.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("requesterUnit")), "%" + unit.toLowerCase() + "%"));
        }
        if (from != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("startTime"), from));
        }
        if (to != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("endTime"), to));
        }
        return bookingRepository.findAll(spec, pageable).map(BookingSummaryDto::from);
    }

    public BookingDto getAdmin(Long id) {
        return BookingDto.from(getEntity(id));
    }

    /**
     * Multi-level approval: {@code booking.require_approval_levels} (default 1) says
     * how many APPROVED decisions are needed before the booking itself flips to
     * APPROVED. Each call records one more level; short of the required count, the
     * booking goes to UNDER_REVIEW (still in {@link #DECIDABLE}, so the next approver
     * can act on it) instead of finalizing. A single REJECTED at any level ends the
     * whole chain immediately — there's no "some levels rejected, some approved" state.
     */
    @Transactional
    public BookingDto approve(Long id, String comment, User approver) {
        Booking booking = getEntity(id);
        ensureDecidable(booking);

        int requiredLevels = configService.getInt("booking.require_approval_levels", 1);
        long approvedSoFar = booking.getApprovals().stream()
                .filter(a -> a.getDecision() == Approval.Decision.APPROVED).count();
        int level = (int) approvedSoFar + 1;
        boolean isFinalLevel = level >= requiredLevels;

        Approval approval = new Approval();
        approval.setBooking(booking);
        approval.setLevel(level);
        approval.setApprover(approver);
        approval.setDecision(Approval.Decision.APPROVED);
        approval.setComment(comment);

        if (isFinalLevel) {
            booking.setStatus(BookingStatus.APPROVED);
            booking.setDecidedAt(Instant.now());
            try {
                bookingRepository.saveAndFlush(booking);
            } catch (DataIntegrityViolationException ex) {
                // The EXCLUDE constraint on bookings caught a genuine race: two pending
                // requests for the same room/time both reached "approve" before either
                // committed. This is the DB-level safety net; the pre-check in submit()
                // only catches conflicts against *already*-approved bookings at submit time.
                throw new ConflictException("Phòng đã được duyệt cho một đơn khác trùng thời gian này — không thể duyệt đơn này nữa.");
            }
        } else {
            booking.setStatus(BookingStatus.UNDER_REVIEW);
            bookingRepository.save(booking);
        }
        approvalRepository.save(approval);
        // booking.getApprovals() was already lazy-loaded above (for approvedSoFar) and
        // Hibernate won't silently re-query it just because a new row was inserted
        // through a separate repository call — without this, BookingDto.from(booking)
        // below would serialize the stale pre-insert list, missing this approval.
        booking.getApprovals().add(approval);

        auditService.log(approver, "BOOKING_APPROVE_LEVEL_" + level, "Booking", booking.getId(),
                Map.of("finalized", isFinalLevel, "comment", comment == null ? "" : comment));

        if (isFinalLevel) {
            mailService.sendTemplateAsync("APPROVED", booking.getContactEmail(), mailVariables(booking), booking.getId());
        }
        return BookingDto.from(booking);
    }

    @Transactional
    public BookingDto reject(Long id, String reason, User approver) {
        Booking booking = getEntity(id);
        ensureDecidable(booking);
        long approvedSoFar = booking.getApprovals().stream()
                .filter(a -> a.getDecision() == Approval.Decision.APPROVED).count();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setDecidedAt(Instant.now());
        bookingRepository.save(booking);

        Approval approval = new Approval();
        approval.setBooking(booking);
        approval.setLevel((int) approvedSoFar + 1);
        approval.setApprover(approver);
        approval.setDecision(Approval.Decision.REJECTED);
        approval.setComment(reason);
        approvalRepository.save(approval);
        booking.getApprovals().add(approval); // see approve() — same stale-collection fix

        auditService.log(approver, "BOOKING_REJECT", "Booking", booking.getId(), Map.of("reason", reason));

        Map<String, String> vars = mailVariables(booking);
        vars.put("ly_do", reason);
        mailService.sendTemplateAsync("REJECTED", booking.getContactEmail(), vars, booking.getId());
        return BookingDto.from(booking);
    }

    @Transactional
    public BookingDto cancel(Long id, String reason, User actor) {
        Booking booking = getEntity(id);
        if (!CANCELLABLE.contains(booking.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể hủy đơn ở trạng thái hiện tại");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        bookingRepository.save(booking);
        auditService.log(actor, "BOOKING_CANCEL", "Booking", booking.getId(), Map.of("reason", reason));
        return BookingDto.from(booking);
    }

    /** "Nghiệm thu xong" — the final step in the state diagram (spec §8.1), after the
     * return slip's item conditions have been recorded. */
    @Transactional
    public BookingDto close(Long id, User actor) {
        Booking booking = getEntity(id);
        if (booking.getStatus() != BookingStatus.RETURNED) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể nghiệm thu đơn đã trả phòng (trạng thái hiện tại: " + booking.getStatus() + ")");
        }
        booking.setStatus(BookingStatus.CLOSED);
        bookingRepository.save(booking);
        auditService.log(actor, "BOOKING_CLOSE", "Booking", booking.getId(), Map.of());
        return BookingDto.from(booking);
    }

    public List<CalendarEventDto> publicCalendar(Instant from, Instant to, Long roomId) {
        boolean showPending = configService.getBoolean("calendar.public_show_pending", false);
        List<Booking> bookings = showPending
                ? bookingRepository.findForInternalCalendar(from, to, roomId)
                : bookingRepository.findForPublicCalendar(from, to, roomId);
        return bookings.stream().map(CalendarEventDto::publicOf).toList();
    }

    public List<CalendarEventDto> internalCalendar(Instant from, Instant to, Long roomId) {
        return bookingRepository.findForInternalCalendar(from, to, roomId).stream()
                .map(CalendarEventDto::from).toList();
    }

    public List<RoomSuggestionDto> suggestRooms(Long id) {
        Booking booking = getEntity(id);
        int neededCapacity = booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0;
        return roomRepository.findAll().stream()
                .filter(r -> r.getStatus() == RoomStatus.ACTIVE)
                .filter(r -> !r.getId().equals(booking.getRoom().getId()))
                .filter(r -> r.getCapacity() != null && r.getCapacity() >= neededCapacity)
                .filter(r -> bookingRepository.findApprovedOverlapping(r.getId(), booking.getStartTime(), booking.getEndTime()).isEmpty())
                .sorted((a, b) -> Integer.compare(a.getCapacity(), b.getCapacity()))
                .map(RoomSuggestionDto::from)
                .toList();
    }

    Booking getEntity(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> NotFoundException.of("Đơn mượn phòng", id));
    }

    private void ensureDecidable(Booking booking) {
        if (!DECIDABLE.contains(booking.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Đơn đã ở trạng thái " + booking.getStatus() + ", không thể duyệt/từ chối lại");
        }
    }

    private void checkConflict(Long roomId, Instant startTime, Instant endTime) {
        boolean hasConflict = !bookingRepository.findApprovedOverlapping(roomId, startTime, endTime).isEmpty();
        if (hasConflict && "BLOCK".equals(configService.getString("booking.on_conflict", "BLOCK"))) {
            throw new ConflictException("Phòng đã có đơn được duyệt trong khung giờ này. Vui lòng chọn thời gian hoặc phòng khác.");
        }
        // on_conflict=WAITLIST: submission is still accepted (spec: real waitlist queueing
        // with auto-notify-when-free is listed as a later-phase enhancement, not P1).
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = codeGenerator.next();
            if (!bookingRepository.existsByCode(candidate)) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể sinh mã đơn, vui lòng thử lại");
    }

    private void attachEquipment(Booking booking, List<BookingEquipmentRequest> items) {
        if (items == null) {
            return;
        }
        for (BookingEquipmentRequest item : items) {
            var equipment = equipmentCatalogRepository.findById(item.equipmentId())
                    .orElseThrow(() -> NotFoundException.of("Thiết bị", item.equipmentId()));
            BookingEquipment be = new BookingEquipment();
            be.setBooking(booking);
            be.setEquipment(equipment);
            be.setQuantity(item.quantity() != null ? item.quantity() : equipment.getDefaultQuantity());
            be.setNote(item.note());
            booking.getEquipments().add(be);
        }
    }

    private void attachFiles(Booking booking, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        List<String> allowedTypes = configService.getList("upload.allowed_types",
                List.of("pdf", "doc", "docx", "jpg", "png"));
        int maxSizeMb = configService.getInt("upload.max_size_mb", 20);

        for (MultipartFile file : files) {
            fileValidator.validate(file, allowedTypes, maxSizeMb);
            StoredFile stored = storageService.store(file, "booking-attachments/" + booking.getCode());

            BookingAttachment attachment = new BookingAttachment();
            attachment.setBooking(booking);
            attachment.setFileName(stored.originalFileName());
            attachment.setStoragePath(stored.storagePath());
            attachment.setMimeType(stored.mimeType());
            attachment.setSizeBytes(stored.sizeBytes());

            String extension = extensionOf(stored.originalFileName());
            if (Set.of("doc", "docx", "xls", "xlsx").contains(extension)) {
                try {
                    byte[] original = storageService.load(stored.storagePath()).getContentAsByteArray();
                    byte[] pdf = previewConversionService.convertToPdf(original, stored.originalFileName());
                    String previewPath = storageService.storeBytes(pdf, stored.originalFileName() + ".pdf",
                            "booking-attachments/" + booking.getCode() + "/preview");
                    attachment.setPreviewPdfPath(previewPath);
                } catch (Exception ex) {
                    // Preview is a convenience, not a hard requirement — the original file
                    // is still safely stored and downloadable even if Gotenberg is down.
                    log.warn("Preview generation failed for {}: {}", stored.originalFileName(), ex.getMessage());
                }
            }
            booking.getAttachments().add(attachment);
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private Map<String, String> mailVariables(Booking booking) {
        Map<String, String> vars = new HashMap<>();
        vars.put("ma_don", booking.getCode());
        vars.put("ten_phong", booking.getRoom().getName());
        vars.put("thoi_gian", MAIL_TIME_FORMAT.format(booking.getStartTime()) + " - "
                + MAIL_TIME_FORMAT.format(booking.getEndTime()));
        vars.put("don_vi", booking.getRequesterUnit());
        return vars;
    }
}
