package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingStatus;

import java.time.Instant;

public record BookingSummaryDto(
        Long id,
        String code,
        Long roomId,
        String roomName,
        String requesterUnit,
        String contactName,
        Instant startTime,
        Instant endTime,
        BookingStatus status,
        Instant submittedAt
) {
    public static BookingSummaryDto from(Booking b) {
        return new BookingSummaryDto(b.getId(), b.getCode(), b.getRoom().getId(), b.getRoom().getName(),
                b.getRequesterUnit(), b.getContactName(), b.getStartTime(), b.getEndTime(), b.getStatus(),
                b.getSubmittedAt());
    }
}
