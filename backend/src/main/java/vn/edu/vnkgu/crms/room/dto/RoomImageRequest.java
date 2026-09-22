package vn.edu.vnkgu.crms.room.dto;

import jakarta.validation.constraints.NotBlank;

public record RoomImageRequest(
        @NotBlank(message = "URL ảnh không được để trống") String url,
        String caption,
        Integer sortOrder
) {
}
