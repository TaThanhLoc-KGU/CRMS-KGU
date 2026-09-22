package vn.edu.vnkgu.crms.room.dto;

import vn.edu.vnkgu.crms.room.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record RoomRequest(
        @NotBlank(message = "Mã phòng không được để trống") String code,
        @NotBlank(message = "Tên phòng không được để trống") String name,
        String building,
        Integer floor,
        @Positive(message = "Sức chứa phải lớn hơn 0") Integer capacity,
        BigDecimal areaM2,
        String description,
        String thumbnailUrl,
        RoomStatus status,
        Integer minLeadHoursOverride
) {
}
