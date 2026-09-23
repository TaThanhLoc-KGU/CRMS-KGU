package vn.edu.vnkgu.crms.handover;

import vn.edu.vnkgu.crms.asset.Asset;
import vn.edu.vnkgu.crms.asset.AssetRepository;
import vn.edu.vnkgu.crms.audit.AuditService;
import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingRepository;
import vn.edu.vnkgu.crms.booking.BookingStatus;
import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.handover.dto.HandoverConfirmInfoDto;
import vn.edu.vnkgu.crms.handover.dto.HandoverItemUpdateRequest;
import vn.edu.vnkgu.crms.handover.dto.HandoverSlipDto;
import vn.edu.vnkgu.crms.handover.dto.HandoverSlipRequest;
import vn.edu.vnkgu.crms.security.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HandoverService {

    private final HandoverSlipRepository slipRepository;
    private final BookingRepository bookingRepository;
    private final AssetRepository assetRepository;
    private final HandoverSlipPdfService pdfService;
    private final HandoverConfirmTokenService confirmTokenService;
    private final AuditService auditService;
    private final String publicBaseUrl;

    public HandoverService(HandoverSlipRepository slipRepository, BookingRepository bookingRepository,
                            AssetRepository assetRepository, HandoverSlipPdfService pdfService,
                            HandoverConfirmTokenService confirmTokenService, AuditService auditService,
                            @Value("${app.public-base-url}") String publicBaseUrl) {
        this.slipRepository = slipRepository;
        this.bookingRepository = bookingRepository;
        this.assetRepository = assetRepository;
        this.pdfService = pdfService;
        this.confirmTokenService = confirmTokenService;
        this.auditService = auditService;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public HandoverSlipDto create(Long bookingId, HandoverSlipRequest request, User creator) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> NotFoundException.of("Đơn mượn phòng", bookingId));

        HandoverSlip slip = new HandoverSlip();
        slip.setBooking(booking);
        slip.setSlipNo(generateSlipNo(request.type()));
        slip.setType(request.type());
        slip.setCreatedBy(creator);
        slip.setBorrowerName(request.borrowerName());
        slip.setBorrowerUnit(request.borrowerUnit());
        slip.setBorrowerPhone(request.borrowerPhone());
        slip.setHandoverTime(Instant.now());
        slip.setNote(request.note());
        slip.setStatus(HandoverStatus.ISSUED);

        if (request.type() == HandoverType.BORROW) {
            if (booking.getStatus() != BookingStatus.APPROVED) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Chỉ có thể lập phiếu mượn cho đơn đã được duyệt (trạng thái hiện tại: "
                                + booking.getStatus() + ")");
            }
            slip.getItems().addAll(buildItemsFromRoomAssets(slip, booking));
            booking.setStatus(BookingStatus.SLIP_ISSUED);
        } else {
            if (booking.getStatus() != BookingStatus.SLIP_ISSUED && booking.getStatus() != BookingStatus.IN_USE) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Chỉ có thể lập phiếu trả sau khi phòng đã được bàn giao (trạng thái hiện tại: "
                                + booking.getStatus() + ")");
            }
            HandoverSlip borrowSlip = slipRepository
                    .findFirstByBookingIdAndTypeOrderByCreatedAtDesc(bookingId, HandoverType.BORROW)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                            "Chưa có phiếu mượn nào cho đơn này để đối chiếu"));
            slip.getItems().addAll(copyItemsFromBorrowSlip(slip, borrowSlip));
            booking.setStatus(BookingStatus.RETURNED);
        }

        // saveAndFlush once, after the whole slip+items graph is built — see CLAUDE.md
        // "Bẫy đã gặp" #3/#9: cascading a transient graph through a single persist()
        // call (this is a brand-new slip, not an already-managed one) sets generated
        // ids correctly on these exact objects, unlike mutating an already-saved parent.
        slipRepository.saveAndFlush(slip);
        bookingRepository.save(booking);

        auditService.log(creator, "HANDOVER_" + request.type(), "Booking", bookingId,
                Map.of("slipNo", slip.getSlipNo()));

        return toDto(slip);
    }

    public HandoverSlipDto get(Long id) {
        return toDto(getEntity(id));
    }

    public List<HandoverSlipDto> listByBooking(Long bookingId) {
        return slipRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public HandoverSlipDto updateItems(Long slipId, HandoverItemUpdateRequest request) {
        HandoverSlip slip = getEntity(slipId);
        Map<Long, HandoverItem> byId = slip.getItems().stream()
                .collect(Collectors.toMap(HandoverItem::getId, Function.identity()));
        for (HandoverItemUpdateRequest.Item itemReq : request.items()) {
            HandoverItem item = byId.get(itemReq.itemId());
            if (item == null) {
                throw NotFoundException.of("Mục CSVC trong phiếu", itemReq.itemId());
            }
            item.setConditionAfter(itemReq.conditionAfter());
            if (itemReq.note() != null) {
                item.setNote(itemReq.note());
            }
        }
        slip.setStatus(HandoverStatus.COMPLETED);
        slipRepository.save(slip);
        return toDto(slip);
    }

    public byte[] generatePdf(Long id) {
        HandoverSlip slip = getEntity(id);
        return pdfService.generate(slip, confirmUrl(slip));
    }

    /** Read-only info for the public confirm page — shown before the visitor taps
     * "confirm" so they see what they're about to confirm, not a blind POST. */
    public HandoverConfirmInfoDto getConfirmInfo(Long slipId, String token) {
        if (!confirmTokenService.isValid(slipId, token)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Mã xác nhận không hợp lệ hoặc đã hết hạn");
        }
        return HandoverConfirmInfoDto.from(getEntity(slipId), false);
    }

    /** Triggered by scanning the slip's QR code — the one place a handover slip's
     * paperwork (created by an officer, at their desk) meets a physical confirmation
     * that it actually happened on site. See CLAUDE.md "Bẫy đã gặp" #18 for why the
     * BORROW/RETURN halves aren't symmetric: only BORROW's confirm actually flips the
     * booking status (to IN_USE, which nothing else in the system ever reaches);
     * RETURN already flips to RETURNED at slip-creation time (P2 behavior, already
     * tested end-to-end) so its confirm just records an audit-trail timestamp. */
    @Transactional
    public HandoverConfirmInfoDto confirm(Long slipId, String token, String clientIp) {
        if (!confirmTokenService.isValid(slipId, token)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Mã xác nhận không hợp lệ hoặc đã hết hạn");
        }
        HandoverSlip slip = getEntity(slipId);
        if (slip.getConfirmedAt() != null) {
            return HandoverConfirmInfoDto.from(slip, true);
        }

        Booking booking = slip.getBooking();
        if (slip.getType() == HandoverType.BORROW && booking.getStatus() == BookingStatus.SLIP_ISSUED) {
            booking.setStatus(BookingStatus.IN_USE);
            bookingRepository.save(booking);
        }
        // RETURN: booking.status is already RETURNED (set when the slip was created —
        // see create() above); nothing left to transition, this confirm is purely the
        // physical-proof timestamp below.

        slip.setConfirmedAt(Instant.now());
        slip.setConfirmedIp(clientIp);
        slipRepository.save(slip);

        auditService.log(null, "HANDOVER_CONFIRM_QR", "Booking", booking.getId(),
                Map.of("slipNo", slip.getSlipNo(), "type", slip.getType().name(), "ip", clientIp == null ? "" : clientIp));

        return HandoverConfirmInfoDto.from(slip, false);
    }

    HandoverSlip getEntity(Long id) {
        return slipRepository.findById(id).orElseThrow(() -> NotFoundException.of("Phiếu mượn/trả", id));
    }

    private HandoverSlipDto toDto(HandoverSlip slip) {
        return HandoverSlipDto.from(slip, confirmUrl(slip));
    }

    private String confirmUrl(HandoverSlip slip) {
        return publicBaseUrl + "/xac-nhan-phieu/" + slip.getId() + "?token=" + confirmTokenService.generate(slip.getId());
    }

    private List<HandoverItem> buildItemsFromRoomAssets(HandoverSlip slip, Booking booking) {
        List<Asset> assets = assetRepository.findByRoomIdOrderByNameAsc(booking.getRoom().getId());
        List<HandoverItem> items = new ArrayList<>();
        for (Asset asset : assets) {
            HandoverItem item = new HandoverItem();
            item.setSlip(slip);
            item.setAsset(asset);
            item.setItemName(asset.getName());
            item.setQuantity(asset.getQuantity());
            item.setConditionBefore(asset.getCondition());
            items.add(item);
        }
        return items;
    }

    private List<HandoverItem> copyItemsFromBorrowSlip(HandoverSlip slip, HandoverSlip borrowSlip) {
        List<HandoverItem> items = new ArrayList<>();
        for (HandoverItem source : borrowSlip.getItems()) {
            HandoverItem item = new HandoverItem();
            item.setSlip(slip);
            item.setAsset(source.getAsset());
            item.setItemName(source.getItemName());
            item.setQuantity(source.getQuantity());
            item.setConditionBefore(source.getConditionBefore());
            items.add(item);
        }
        return items;
    }

    private String generateSlipNo(HandoverType type) {
        String prefix = (type == HandoverType.BORROW ? "PM" : "PT") + "-" + Year.now(ZoneOffset.UTC) + "-";
        for (int attempt = 0; attempt < 5; attempt++) {
            long count = slipRepository.countBySlipNoStartingWith(prefix);
            String candidate = prefix + String.format("%06d", count + 1);
            if (!slipRepository.existsBySlipNo(candidate)) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể sinh số phiếu, vui lòng thử lại");
    }
}
