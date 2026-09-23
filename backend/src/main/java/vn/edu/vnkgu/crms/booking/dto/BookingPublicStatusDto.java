package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingStatus;

import java.time.Instant;

/** What an anonymous requester is allowed to see when looking up their own booking. */
public record BookingPublicStatusDto(
        String code,
        String roomName,
        Instant startTime,
        Instant endTime,
        BookingStatus status,
        Instant submittedAt,
        Instant decidedAt,
        String cancelReason
) {
    public static BookingPublicStatusDto from(Booking b) {
        return new BookingPublicStatusDto(b.getCode(), b.getRoom().getName(), b.getStartTime(), b.getEndTime(),
                b.getStatus(), b.getSubmittedAt(), b.getDecidedAt(), b.getCancelReason());
    }
}
