package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Approval;

import java.time.Instant;

public record ApprovalDto(
        Long id,
        int level,
        String approverName,
        Approval.Decision decision,
        String comment,
        Instant decidedAt
) {
    public static ApprovalDto from(Approval a) {
        return new ApprovalDto(a.getId(), a.getLevel(), a.getApprover().getFullName(), a.getDecision(),
                a.getComment(), a.getDecidedAt());
    }
}
