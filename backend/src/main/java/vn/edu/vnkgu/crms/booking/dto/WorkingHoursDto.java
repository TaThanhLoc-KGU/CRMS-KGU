package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.WorkingHours;

import java.time.LocalTime;

public record WorkingHoursDto(Long id, int dayOfWeek, LocalTime startTime, LocalTime endTime, boolean workingDay) {
    public static WorkingHoursDto from(WorkingHours w) {
        return new WorkingHoursDto(w.getId(), w.getDayOfWeek(), w.getStartTime(), w.getEndTime(), w.isWorkingDay());
    }
}
