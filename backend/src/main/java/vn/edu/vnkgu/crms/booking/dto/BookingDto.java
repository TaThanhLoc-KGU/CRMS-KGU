package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingSource;
import vn.edu.vnkgu.crms.booking.BookingStatus;

import java.time.Instant;
import java.util.List;

public record BookingDto(
        Long id,
        String code,
        Long roomId,
        String roomCode,
        String roomName,
        Long setupStyleId,
        String setupStyleName,
        String requesterUnit,
        String contactName,
        String contactEmail,
        String contactPhone,
        Instant startTime,
        Instant endTime,
        Integer expectedAttendees,
        String purpose,
        String extraRequirements,
        BookingStatus status,
        Instant submittedAt,
        Instant decidedAt,
        String cancelReason,
        BookingSource source,
        String recurrenceGroup,
        List<BookingAttachmentDto> attachments,
        List<BookingEquipmentDto> equipments,
        List<ApprovalDto> approvals
) {
    public static BookingDto from(Booking b) {
        return new BookingDto(
                b.getId(), b.getCode(),
                b.getRoom().getId(), b.getRoom().getCode(), b.getRoom().getName(),
                b.getSetupStyle() != null ? b.getSetupStyle().getId() : null,
                b.getSetupStyle() != null ? b.getSetupStyle().getName() : null,
                b.getRequesterUnit(), b.getContactName(), b.getContactEmail(), b.getContactPhone(),
                b.getStartTime(), b.getEndTime(), b.getExpectedAttendees(), b.getPurpose(),
                b.getExtraRequirements(), b.getStatus(), b.getSubmittedAt(), b.getDecidedAt(),
                b.getCancelReason(), b.getSource(), b.getRecurrenceGroup(),
                b.getAttachments().stream().map(BookingAttachmentDto::from).toList(),
                b.getEquipments().stream().map(BookingEquipmentDto::from).toList(),
                b.getApprovals().stream().map(ApprovalDto::from).toList());
    }
}
