package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.booking.dto.BookingPublicStatusDto;
import vn.edu.vnkgu.crms.booking.dto.BookingSubmitRequest;
import vn.edu.vnkgu.crms.booking.dto.BookingSubmitResultDto;
import vn.edu.vnkgu.crms.booking.dto.CalendarEventDto;
import vn.edu.vnkgu.crms.booking.dto.EquipmentCatalogDto;
import vn.edu.vnkgu.crms.booking.dto.SignageRoomStatusDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@Tag(name = "Public Booking", description = "Đăng ký mượn phòng & lịch công khai (không cần đăng nhập)")
public class PublicBookingController {

    private final BookingService bookingService;
    private final EquipmentCatalogRepository equipmentCatalogRepository;
    private final IcsGenerator icsGenerator;

    public PublicBookingController(BookingService bookingService, EquipmentCatalogRepository equipmentCatalogRepository,
                                    IcsGenerator icsGenerator) {
        this.bookingService = bookingService;
        this.equipmentCatalogRepository = equipmentCatalogRepository;
        this.icsGenerator = icsGenerator;
    }

    @PostMapping(value = "/bookings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public BookingSubmitResultDto submit(@Valid @RequestPart("data") BookingSubmitRequest request,
                                          @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return bookingService.submit(request, files);
    }

    @GetMapping("/bookings/lookup")
    public BookingPublicStatusDto lookup(@RequestParam String code, @RequestParam String email) {
        return bookingService.lookupPublic(code, email);
    }

    @GetMapping("/calendar")
    public List<CalendarEventDto> calendar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                            @RequestParam(required = false) Long roomId) {
        return bookingService.publicCalendar(from, to, roomId);
    }

    @GetMapping(value = "/calendar.ics", produces = "text/calendar")
    public ResponseEntity<String> calendarIcs(@RequestParam(required = false) Long roomId) {
        Instant from = Instant.now();
        Instant to = from.plusSeconds(90L * 24 * 3600); // matches booking.max_advance_days default window
        String ics = icsGenerator.generate(bookingService.publicCalendar(from, to, roomId));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=crms-kgu.ics")
                .body(ics);
    }

    @GetMapping("/equipments")
    public List<EquipmentCatalogDto> equipments() {
        return equipmentCatalogRepository.findByActiveTrue().stream().map(EquipmentCatalogDto::from).toList();
    }

    @GetMapping("/signage")
    public List<SignageRoomStatusDto> signage() {
        return bookingService.signageStatus();
    }
}
