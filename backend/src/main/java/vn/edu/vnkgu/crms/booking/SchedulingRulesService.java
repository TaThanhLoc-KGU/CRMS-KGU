package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.config.domain.ConfigService;
import vn.edu.vnkgu.crms.room.Room;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Everything here reads its thresholds from {@link ConfigService} (the configurations
 * table) — never hardcoded, per the project's non-negotiable rule. Wall-clock rules
 * (working hours, holidays) are evaluated in Vietnam local time regardless of the
 * JVM's UTC default, since that's what the numbers in `working_hours` actually mean.
 */
@Service
public class SchedulingRulesService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DISPLAY_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final ConfigService configService;
    private final WorkingHoursRepository workingHoursRepository;
    private final PublicHolidayRepository publicHolidayRepository;

    public SchedulingRulesService(ConfigService configService, WorkingHoursRepository workingHoursRepository,
                                   PublicHolidayRepository publicHolidayRepository) {
        this.configService = configService;
        this.workingHoursRepository = workingHoursRepository;
        this.publicHolidayRepository = publicHolidayRepository;
    }

    public void validate(Room room, Instant startTime, Instant endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ kết thúc phải sau giờ bắt đầu");
        }

        validateLeadTime(room, startTime);
        validateMaxAdvance(startTime);
        validateWorkingHours(startTime, endTime);
    }

    private void validateLeadTime(Room room, Instant startTime) {
        int minLeadHours = room.getMinLeadHoursOverride() != null
                ? room.getMinLeadHoursOverride()
                : configService.getInt("booking.min_lead_hours", 48);
        Instant earliestAllowed = Instant.now().plus(Duration.ofHours(minLeadHours));
        if (startTime.isBefore(earliestAllowed)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Phải đăng ký trước ít nhất " + minLeadHours + " giờ. Thời điểm sớm nhất có thể chọn: "
                            + DISPLAY_FORMAT.format(ZonedDateTime.ofInstant(earliestAllowed, VN_ZONE)));
        }
    }

    private void validateMaxAdvance(Instant startTime) {
        int maxAdvanceDays = configService.getInt("booking.max_advance_days", 90);
        Instant latestAllowed = Instant.now().plus(Duration.ofDays(maxAdvanceDays));
        if (startTime.isAfter(latestAllowed)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ được đăng ký trước tối đa " + maxAdvanceDays + " ngày");
        }
    }

    private void validateWorkingHours(Instant startTime, Instant endTime) {
        ZonedDateTime startLocal = ZonedDateTime.ofInstant(startTime, VN_ZONE);
        ZonedDateTime endLocal = ZonedDateTime.ofInstant(endTime, VN_ZONE);

        if (!startLocal.toLocalDate().equals(endLocal.toLocalDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Thời gian mượn phòng phải nằm trong cùng một ngày");
        }

        LocalDate date = startLocal.toLocalDate();
        if (publicHolidayRepository.existsByHolidayDate(date)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đăng ký vào ngày nghỉ lễ (" + date + ")");
        }

        int isoDayOfWeek = startLocal.getDayOfWeek().getValue(); // 1=Monday..7=Sunday, matches ISO-8601
        WorkingHours hours = workingHoursRepository.findByDayOfWeek(isoDayOfWeek).orElse(null);
        if (hours == null || !hours.isWorkingDay()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Trung tâm không nhận đặt phòng vào " + vietnameseDayName(startLocal.getDayOfWeek()));
        }

        LocalTime startOfDay = startLocal.toLocalTime();
        LocalTime endOfDay = endLocal.toLocalTime();
        if (startOfDay.isBefore(hours.getStartTime()) || endOfDay.isAfter(hours.getEndTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Thời gian mượn phải nằm trong giờ làm việc (" + hours.getStartTime() + " - "
                            + hours.getEndTime() + ")");
        }
    }

    private String vietnameseDayName(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "Thứ Hai";
            case TUESDAY -> "Thứ Ba";
            case WEDNESDAY -> "Thứ Tư";
            case THURSDAY -> "Thứ Năm";
            case FRIDAY -> "Thứ Sáu";
            case SATURDAY -> "Thứ Bảy";
            case SUNDAY -> "Chủ Nhật";
        };
    }
}
