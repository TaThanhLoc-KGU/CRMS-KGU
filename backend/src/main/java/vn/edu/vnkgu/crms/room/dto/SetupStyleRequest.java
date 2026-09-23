package vn.edu.vnkgu.crms.room.dto;

import jakarta.validation.constraints.NotBlank;

public record SetupStyleRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        String icon
) {
}
