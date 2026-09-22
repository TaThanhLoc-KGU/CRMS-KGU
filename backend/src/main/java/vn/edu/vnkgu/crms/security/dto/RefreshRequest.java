package vn.edu.vnkgu.crms.security.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(
        @NotBlank(message = "Refresh token không được để trống") String refreshToken
) {
}
