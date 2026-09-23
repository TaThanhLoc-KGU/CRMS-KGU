package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record EquipmentCatalogRequest(
        @NotBlank String code,
        @NotBlank String name,
        String unit,
        Boolean shared,
        Integer defaultQuantity,
        Boolean active
) {
}
