package vn.edu.vnkgu.crms.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String unit,
        @NotBlank String roleCode,
        boolean active
) {
}
