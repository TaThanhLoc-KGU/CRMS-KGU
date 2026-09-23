package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.common.preview.PreviewTokenService;
import vn.edu.vnkgu.crms.common.storage.StorageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings/{bookingId}/attachments/{attachmentId}")
@Tag(name = "Booking Attachments", description = "Xem/tải văn bản đính kèm")
public class BookingAttachmentController {

    private final BookingService bookingService;
    private final BookingAttachmentRepository attachmentRepository;
    private final StorageService storageService;
    private final PreviewTokenService previewTokenService;

    public BookingAttachmentController(BookingService bookingService, BookingAttachmentRepository attachmentRepository,
                                        StorageService storageService, PreviewTokenService previewTokenService) {
        this.bookingService = bookingService;
        this.attachmentRepository = attachmentRepository;
        this.storageService = storageService;
        this.previewTokenService = previewTokenService;
    }

    /** Authenticated call that hands back a short-lived signed URL safe to drop into an &lt;iframe src&gt;. */
    @GetMapping("/preview-url")
    public Map<String, String> previewUrl(@PathVariable Long bookingId, @PathVariable Long attachmentId) {
        getAttachmentOwnedBy(bookingId, attachmentId);
        String token = previewTokenService.generate(bookingId, attachmentId);
        return Map.of("url", "/api/v1/bookings/" + bookingId + "/attachments/" + attachmentId + "/preview?token=" + token);
    }

    /** Public path (see SecurityConfig) — authorization happens via the signed token, not a JWT,
     * because a browser &lt;iframe&gt;/&lt;img&gt; can't attach an Authorization header. */
    @GetMapping("/preview")
    public ResponseEntity<Resource> preview(@PathVariable Long bookingId, @PathVariable Long attachmentId,
                                             @RequestParam String token) {
        if (!previewTokenService.isValid(bookingId, attachmentId, token)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Link xem trước không hợp lệ hoặc đã hết hạn");
        }
        BookingAttachment attachment = getAttachmentOwnedBy(bookingId, attachmentId);
        String pathToServe = attachment.getPreviewPdfPath() != null ? attachment.getPreviewPdfPath() : attachment.getStoragePath();
        Resource resource = storageService.load(pathToServe);
        MediaType mediaType = pathToServe.endsWith(".pdf") || attachment.getPreviewPdfPath() != null
                ? MediaType.APPLICATION_PDF
                : MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().build().toString())
                .body(resource);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> download(@PathVariable Long bookingId, @PathVariable Long attachmentId) {
        BookingAttachment attachment = getAttachmentOwnedBy(bookingId, attachmentId);
        Resource resource = storageService.load(attachment.getStoragePath());
        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(attachment.getFileName()).build().toString())
                .body(resource);
    }

    private BookingAttachment getAttachmentOwnedBy(Long bookingId, Long attachmentId) {
        Booking booking = bookingService.getEntity(bookingId);
        return attachmentRepository.findById(attachmentId)
                .filter(a -> a.getBooking().getId().equals(booking.getId()))
                .orElseThrow(() -> NotFoundException.of("Văn bản đính kèm", attachmentId));
    }
}
