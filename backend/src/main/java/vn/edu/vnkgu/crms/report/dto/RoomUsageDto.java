package vn.edu.vnkgu.crms.report.dto;

public record RoomUsageDto(
        Long roomId,
        String roomCode,
        String roomName,
        long bookingCount,
        double totalHours
) {
}
