package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.booking.dto.BookingDto;
import vn.edu.vnkgu.crms.booking.dto.DecisionRequest;
import vn.edu.vnkgu.crms.booking.dto.ReasonRequest;
import vn.edu.vnkgu.crms.booking.dto.RoomSuggestionDto;
import vn.edu.vnkgu.crms.booking.dto.BookingSummaryDto;
import vn.edu.vnkgu.crms.security.CrmsUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@Tag(name = "Bookings", description = "Duyệt đơn mượn phòng (admin)")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public Page<BookingSummaryDto> list(@RequestParam(required = false) BookingStatus status,
                                         @RequestParam(required = false) Long roomId,
                                         @RequestParam(required = false) String unit,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                         Pageable pageable) {
        return bookingService.listAdmin(status, roomId, unit, from, to, pageable);
    }

    @GetMapping("/{id}")
    public BookingDto get(@PathVariable Long id) {
        return bookingService.getAdmin(id);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public BookingDto approve(@PathVariable Long id, @RequestBody(required = false) DecisionRequest request,
                               @AuthenticationPrincipal CrmsUserPrincipal principal) {
        String comment = request != null ? request.comment() : null;
        return bookingService.approve(id, comment, principal.getUser());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public BookingDto reject(@PathVariable Long id, @Valid @RequestBody ReasonRequest request,
                              @AuthenticationPrincipal CrmsUserPrincipal principal) {
        return bookingService.reject(id, request.reason(), principal.getUser());
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id, @Valid @RequestBody ReasonRequest request,
                              @AuthenticationPrincipal CrmsUserPrincipal principal) {
        return bookingService.cancel(id, request.reason(), principal.getUser());
    }

    @PostMapping("/{id}/close")
    public BookingDto close(@PathVariable Long id, @AuthenticationPrincipal CrmsUserPrincipal principal) {
        return bookingService.close(id, principal.getUser());
    }

    @GetMapping("/{id}/suggest-rooms")
    public List<RoomSuggestionDto> suggestRooms(@PathVariable Long id) {
        return bookingService.suggestRooms(id);
    }
}
