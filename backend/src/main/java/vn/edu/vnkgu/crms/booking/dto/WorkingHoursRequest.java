package vn.edu.vnkgu.crms.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record WorkingHoursRequest(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        boolean workingDay
) {
}
