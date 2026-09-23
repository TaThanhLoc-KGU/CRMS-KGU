package vn.edu.vnkgu.crms.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String password,
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String unit,
        @NotBlank(message = "Vai trò không được để trống (ADMIN/OFFICER/APPROVER)") String roleCode
) {
}
