package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.BookingEquipment;

public record BookingEquipmentDto(
        Long id,
        Long equipmentId,
        String equipmentName,
        int quantity,
        String note
) {
    public static BookingEquipmentDto from(BookingEquipment e) {
        return new BookingEquipmentDto(e.getId(), e.getEquipment().getId(), e.getEquipment().getName(),
                e.getQuantity(), e.getNote());
    }
}
