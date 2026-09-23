package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record ReasonRequest(
        @NotBlank(message = "Vui lòng nhập lý do") String reason
) {
}
