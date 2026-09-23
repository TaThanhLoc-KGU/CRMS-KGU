package vn.edu.vnkgu.crms.handover;

import vn.edu.vnkgu.crms.handover.dto.HandoverItemUpdateRequest;
import vn.edu.vnkgu.crms.handover.dto.HandoverSlipDto;
import vn.edu.vnkgu.crms.handover.dto.HandoverSlipRequest;
import vn.edu.vnkgu.crms.security.CrmsUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Handover Slips", description = "Phiếu mượn/trả phòng (Officer/Admin)")
public class HandoverController {

    private final HandoverService handoverService;

    public HandoverController(HandoverService handoverService) {
        this.handoverService = handoverService;
    }

    @PostMapping("/bookings/{bookingId}/slips")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    @ResponseStatus(HttpStatus.CREATED)
    public HandoverSlipDto create(@PathVariable Long bookingId, @Valid @RequestBody HandoverSlipRequest request,
                                   @AuthenticationPrincipal CrmsUserPrincipal principal) {
        return handoverService.create(bookingId, request, principal.getUser());
    }

    @GetMapping("/bookings/{bookingId}/slips")
    public List<HandoverSlipDto> listByBooking(@PathVariable Long bookingId) {
        return handoverService.listByBooking(bookingId);
    }

    @GetMapping("/slips/{id}")
    public HandoverSlipDto get(@PathVariable Long id) {
        return handoverService.get(id);
    }

    @PatchMapping("/slips/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public HandoverSlipDto updateItems(@PathVariable Long id, @Valid @RequestBody HandoverItemUpdateRequest request) {
        return handoverService.updateItems(id, request);
    }

    @GetMapping("/slips/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        HandoverSlipDto slip = handoverService.get(id);
        byte[] pdf = handoverService.generatePdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + slip.slipNo() + ".pdf")
                .body(pdf);
    }
}
