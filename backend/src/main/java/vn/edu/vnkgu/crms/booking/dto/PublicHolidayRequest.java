package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PublicHolidayRequest(
        @NotNull LocalDate holidayDate,
        @NotBlank String name
) {
}
