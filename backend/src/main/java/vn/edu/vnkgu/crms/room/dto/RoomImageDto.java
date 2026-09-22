package vn.edu.vnkgu.crms.room.dto;

import vn.edu.vnkgu.crms.room.RoomImage;

public record RoomImageDto(
        Long id,
        String url,
        String caption,
        int sortOrder
) {
    public static RoomImageDto from(RoomImage image) {
        return new RoomImageDto(image.getId(), image.getUrl(), image.getCaption(), image.getSortOrder());
    }
}
