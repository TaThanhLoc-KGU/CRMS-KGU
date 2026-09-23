package vn.edu.vnkgu.crms.handover.dto;

import vn.edu.vnkgu.crms.handover.HandoverSlip;
import vn.edu.vnkgu.crms.handover.HandoverStatus;
import vn.edu.vnkgu.crms.handover.HandoverType;

import java.time.Instant;
import java.util.List;

public record HandoverSlipDto(
        Long id,
        Long bookingId,
        String bookingCode,
        String roomName,
        String slipNo,
        HandoverType type,
        String createdByName,
        String borrowerName,
        String borrowerUnit,
        String borrowerPhone,
        Instant handoverTime,
        String note,
        HandoverStatus status,
        Instant createdAt,
        Instant confirmedAt,
        String confirmUrl,
        List<HandoverItemDto> items
) {
    public static HandoverSlipDto from(HandoverSlip slip, String confirmUrl) {
        return new HandoverSlipDto(
                slip.getId(),
                slip.getBooking().getId(),
                slip.getBooking().getCode(),
                slip.getBooking().getRoom().getName(),
                slip.getSlipNo(),
                slip.getType(),
                slip.getCreatedBy().getFullName(),
                slip.getBorrowerName(),
                slip.getBorrowerUnit(),
                slip.getBorrowerPhone(),
                slip.getHandoverTime(),
                slip.getNote(),
                slip.getStatus(),
                slip.getCreatedAt(),
                slip.getConfirmedAt(),
                confirmUrl,
                slip.getItems().stream().map(HandoverItemDto::from).toList());
    }
}
