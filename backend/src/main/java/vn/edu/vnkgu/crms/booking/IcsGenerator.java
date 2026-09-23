package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.booking.dto.CalendarEventDto;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Hand-rolled instead of pulling in ical4j/biweekly — the feed only ever needs a
 * flat list of simple VEVENTs (no recurrence, no timezone tables), which is a small
 * enough format to not warrant a new dependency. */
@Component
public class IcsGenerator {

    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
            .withZone(ZoneOffset.UTC);

    public String generate(List<CalendarEventDto> events) {
        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//CRMS-KGU//Booking Calendar//VI\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        Instant now = Instant.now();
        for (CalendarEventDto event : events) {
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:booking-").append(event.bookingId()).append("@crms-kgu\r\n");
            sb.append("DTSTAMP:").append(STAMP.format(now)).append("\r\n");
            sb.append("DTSTART:").append(STAMP.format(event.start())).append("\r\n");
            sb.append("DTEND:").append(STAMP.format(event.end())).append("\r\n");
            sb.append("SUMMARY:").append(escape(event.roomName() + " - " + event.title())).append("\r\n");
            sb.append("END:VEVENT\r\n");
        }
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private String escape(String text) {
        return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;");
    }
}
