package vn.edu.vnkgu.crms.room.dto;

import vn.edu.vnkgu.crms.room.Room;
import vn.edu.vnkgu.crms.room.RoomStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RoomDto(
        Long id,
        String code,
        String name,
        String building,
        Integer floor,
        Integer capacity,
        BigDecimal areaM2,
        String description,
        String thumbnailUrl,
        RoomStatus status,
        Integer minLeadHoursOverride,
        List<RoomImageDto> images,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoomDto from(Room room) {
        return new RoomDto(
                room.getId(),
                room.getCode(),
                room.getName(),
                room.getBuilding(),
                room.getFloor(),
                room.getCapacity(),
                room.getAreaM2(),
                room.getDescription(),
                room.getThumbnailUrl(),
                room.getStatus(),
                room.getMinLeadHoursOverride(),
                room.getImages().stream().map(RoomImageDto::from).toList(),
                room.getCreatedAt(),
                room.getUpdatedAt());
    }
}
