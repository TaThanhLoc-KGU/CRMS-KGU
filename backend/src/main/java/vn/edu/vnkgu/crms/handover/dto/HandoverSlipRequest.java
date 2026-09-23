package vn.edu.vnkgu.crms.handover.dto;

import vn.edu.vnkgu.crms.handover.HandoverType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HandoverSlipRequest(
        @NotNull HandoverType type,
        @NotBlank(message = "Tên người mượn không được để trống") String borrowerName,
        String borrowerUnit,
        String borrowerPhone,
        String note
) {
}
