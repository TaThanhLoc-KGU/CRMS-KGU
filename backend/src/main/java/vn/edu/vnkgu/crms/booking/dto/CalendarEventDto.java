package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingStatus;

import java.time.Instant;

public record CalendarEventDto(
        Long bookingId,
        Long roomId,
        String roomName,
        String title,
        Instant start,
        Instant end,
        BookingStatus status
) {
    public static CalendarEventDto from(Booking b) {
        return new CalendarEventDto(b.getId(), b.getRoom().getId(), b.getRoom().getName(), b.getRequesterUnit(),
                b.getStartTime(), b.getEndTime(), b.getStatus());
    }

    /** Public calendar hides which unit booked the room — shows only that the slot is taken. */
    public static CalendarEventDto publicOf(Booking b) {
        return new CalendarEventDto(b.getId(), b.getRoom().getId(), b.getRoom().getName(),
                b.getStatus() == BookingStatus.APPROVED || b.getStatus() == BookingStatus.SLIP_ISSUED
                        || b.getStatus() == BookingStatus.IN_USE ? "Đã đặt" : "Chờ duyệt",
                b.getStartTime(), b.getEndTime(), b.getStatus());
    }
}
