package vn.edu.vnkgu.crms.config.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SmtpTestRequest(
        @NotBlank @Email(message = "Email không hợp lệ") String toEmail
) {
}
