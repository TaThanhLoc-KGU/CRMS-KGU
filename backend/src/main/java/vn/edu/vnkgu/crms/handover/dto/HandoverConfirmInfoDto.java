package vn.edu.vnkgu.crms.handover.dto;

import vn.edu.vnkgu.crms.handover.HandoverSlip;
import vn.edu.vnkgu.crms.handover.HandoverType;

import java.time.Instant;

/** What the public QR-confirm page (no login) is allowed to see about a slip —
 * deliberately a lot less than {@link HandoverSlipDto}: no borrower phone, no item
 * list, nothing an unauthenticated scanner shouldn't need. */
public record HandoverConfirmInfoDto(
        Long slipId,
        HandoverType type,
        String slipNo,
        String roomName,
        String bookingCode,
        String borrowerName,
        boolean alreadyConfirmed,
        Instant confirmedAt
) {
    public static HandoverConfirmInfoDto from(HandoverSlip slip, boolean alreadyConfirmedHint) {
        return new HandoverConfirmInfoDto(
                slip.getId(),
                slip.getType(),
                slip.getSlipNo(),
                slip.getBooking().getRoom().getName(),
                slip.getBooking().getCode(),
                slip.getBorrowerName(),
                alreadyConfirmedHint || slip.getConfirmedAt() != null,
                slip.getConfirmedAt());
    }
}
