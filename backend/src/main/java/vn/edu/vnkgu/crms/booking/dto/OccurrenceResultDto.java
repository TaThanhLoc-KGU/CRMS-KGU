package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.waitlist.dto.WaitlistEntryDto;

import java.time.Instant;

/** One occurrence of a recurring booking submission — see BookingSubmitResultDto. */
public record OccurrenceResultDto(
        Instant startTime,
        Instant endTime,
        String outcome, // CREATED | WAITLISTED | REJECTED
        BookingDto booking,
        WaitlistEntryDto waitlistEntry,
        String reason
) {
    public static OccurrenceResultDto created(Instant start, Instant end, BookingDto booking) {
        return new OccurrenceResultDto(start, end, "CREATED", booking, null, null);
    }

    public static OccurrenceResultDto waitlisted(Instant start, Instant end, WaitlistEntryDto entry) {
        return new OccurrenceResultDto(start, end, "WAITLISTED", null, entry, null);
    }

    public static OccurrenceResultDto rejected(Instant start, Instant end, String reason) {
        return new OccurrenceResultDto(start, end, "REJECTED", null, null, reason);
    }
}
