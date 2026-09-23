package vn.edu.vnkgu.crms.waitlist.dto;

import vn.edu.vnkgu.crms.waitlist.WaitlistEntry;
import vn.edu.vnkgu.crms.waitlist.WaitlistStatus;

import java.time.Instant;

public record WaitlistEntryDto(
        Long id,
        Long roomId,
        String roomCode,
        String roomName,
        Instant startTime,
        Instant endTime,
        String requesterUnit,
        String contactName,
        String contactEmail,
        String contactPhone,
        Integer expectedAttendees,
        String purpose,
        WaitlistStatus status,
        Instant createdAt,
        Instant notifiedAt
) {
    public static WaitlistEntryDto from(WaitlistEntry entry) {
        return new WaitlistEntryDto(
                entry.getId(),
                entry.getRoom().getId(),
                entry.getRoom().getCode(),
                entry.getRoom().getName(),
                entry.getStartTime(),
                entry.getEndTime(),
                entry.getRequesterUnit(),
                entry.getContactName(),
                entry.getContactEmail(),
                entry.getContactPhone(),
                entry.getExpectedAttendees(),
                entry.getPurpose(),
                entry.getStatus(),
                entry.getCreatedAt(),
                entry.getNotifiedAt());
    }
}
