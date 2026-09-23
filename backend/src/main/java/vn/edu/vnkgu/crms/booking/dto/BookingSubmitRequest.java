package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.List;

public record BookingSubmitRequest(
        @NotNull Long roomId,
        Long setupStyleId,
        @NotBlank(message = "Tên đơn vị không được để trống") String requesterUnit,
        @NotBlank(message = "Tên người liên hệ không được để trống") String contactName,
        @NotBlank @Email(message = "Email không hợp lệ") String contactEmail,
        String contactPhone,
        @NotNull(message = "Vui lòng chọn thời gian bắt đầu") Instant startTime,
        @NotNull(message = "Vui lòng chọn thời gian kết thúc") Instant endTime,
        @Positive Integer expectedAttendees,
        String purpose,
        String extraRequirements,
        List<BookingEquipmentRequest> equipmentItems,
        @AssertTrue(message = "Phải đồng ý nội quy sử dụng phòng") boolean agreeToTerms
) {
}
