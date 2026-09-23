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
        @AssertTrue(message = "Phải đồng ý nội quy sử dụng phòng") boolean agreeToTerms,
        /** Recurring bookings (spec §16 item 10): number of weekly occurrences
         * starting at startTime/endTime, e.g. 4 = this week + 3 more weekly repeats.
         * null or 1 = an ordinary one-off booking (unchanged behavior). */
        @jakarta.validation.constraints.Min(value = 1, message = "Số lần lặp phải từ 1 trở lên")
        @jakarta.validation.constraints.Max(value = 12, message = "Chỉ hỗ trợ lặp lại tối đa 12 tuần")
        Integer repeatWeeks
) {
}
