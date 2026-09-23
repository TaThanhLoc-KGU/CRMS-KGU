package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.room.Room;

import java.time.Instant;

/** One room's row on the digital signage screen (spec §16 item 12) — deliberately
 * as bare as the public calendar (no requester unit/contact, same privacy rule as
 * {@link CalendarEventDto#publicOf}): a screen outside a room only needs to show
 * "đang họp / trống", not who is meeting. */
public record SignageRoomStatusDto(
        Long roomId,
        String roomCode,
        String roomName,
        Integer floor,
        boolean occupied,
        Instant occupiedUntil,
        Instant nextStart
) {
    public static SignageRoomStatusDto of(Room room, Booking current, Booking next) {
        return new SignageRoomStatusDto(
                room.getId(), room.getCode(), room.getName(), room.getFloor(),
                current != null,
                current != null ? current.getEndTime() : null,
                next != null ? next.getStartTime() : null);
    }
}
