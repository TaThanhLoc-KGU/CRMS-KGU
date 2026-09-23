package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.booking.dto.CalendarEventDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
@Tag(name = "Calendar", description = "Lịch nội bộ, đầy đủ trạng thái (admin)")
public class CalendarController {

    private final BookingService bookingService;

    public CalendarController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<CalendarEventDto> calendar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                            @RequestParam(required = false) Long roomId) {
        return bookingService.internalCalendar(from, to, roomId);
    }
}
