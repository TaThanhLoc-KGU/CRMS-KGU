package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.waitlist.dto.WaitlistEntryDto;

import java.util.List;

/**
 * What {@code POST /api/v1/public/bookings} returns — one of three shapes depending
 * on what actually happened, since a single occurrence can be created outright,
 * routed to the waitlist (room busy, {@code booking.on_conflict=WAITLIST}), or (for
 * a recurring request) split across several independent per-occurrence outcomes.
 */
public record BookingSubmitResultDto(
        boolean recurring,
        boolean waitlisted,
        BookingDto booking,
        WaitlistEntryDto waitlistEntry,
        List<OccurrenceResultDto> occurrences
) {
    public static BookingSubmitResultDto ofBooking(BookingDto booking) {
        return new BookingSubmitResultDto(false, false, booking, null, null);
    }

    public static BookingSubmitResultDto ofWaitlist(WaitlistEntryDto entry) {
        return new BookingSubmitResultDto(false, true, null, entry, null);
    }

    public static BookingSubmitResultDto ofRecurring(List<OccurrenceResultDto> occurrences) {
        return new BookingSubmitResultDto(true, false, null, null, occurrences);
    }
}
