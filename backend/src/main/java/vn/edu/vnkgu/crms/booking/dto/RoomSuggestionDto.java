package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.room.Room;

public record RoomSuggestionDto(
        Long roomId,
        String code,
        String name,
        Integer capacity,
        Integer floor
) {
    public static RoomSuggestionDto from(Room r) {
        return new RoomSuggestionDto(r.getId(), r.getCode(), r.getName(), r.getCapacity(), r.getFloor());
    }
}
