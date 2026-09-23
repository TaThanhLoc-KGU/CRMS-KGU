package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.PublicHoliday;

import java.time.LocalDate;

public record PublicHolidayDto(Long id, LocalDate holidayDate, String name) {
    public static PublicHolidayDto from(PublicHoliday h) {
        return new PublicHolidayDto(h.getId(), h.getHolidayDate(), h.getName());
    }
}
