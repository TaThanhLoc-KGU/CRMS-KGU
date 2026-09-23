package vn.edu.vnkgu.crms.landing.dto;

import jakarta.validation.constraints.NotBlank;

public record LandingSlideRequest(
        @NotBlank(message = "Vui lòng nhập URL ảnh") String imageUrl,
        String caption,
        Integer sortOrder,
        Boolean active
) {
}
