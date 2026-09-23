package vn.edu.vnkgu.crms.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String newPassword
) {
}
