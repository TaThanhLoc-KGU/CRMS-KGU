package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.BookingAttachment;

public record BookingAttachmentDto(
        Long id,
        String fileName,
        String mimeType,
        Long sizeBytes
) {
    public static BookingAttachmentDto from(BookingAttachment a) {
        return new BookingAttachmentDto(a.getId(), a.getFileName(), a.getMimeType(), a.getSizeBytes());
    }
}
