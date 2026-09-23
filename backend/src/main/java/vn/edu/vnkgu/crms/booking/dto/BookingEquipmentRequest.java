package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BookingEquipmentRequest(
        @NotNull Long equipmentId,
        @Min(1) Integer quantity,
        String note
) {
}
