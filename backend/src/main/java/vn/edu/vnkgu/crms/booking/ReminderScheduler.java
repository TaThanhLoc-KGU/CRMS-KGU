package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.config.domain.ConfigService;
import vn.edu.vnkgu.crms.mail.MailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/** Polls for bookings that need a reminder email — spec §16 "Nhắc lịch tự động".
 * A sent-at column on the booking itself (not a separate reminders table) is enough
 * here since each booking only ever needs at most one of each reminder kind. */
@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);
    private static final DateTimeFormatter MAIL_TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final BookingRepository bookingRepository;
    private final ConfigService configService;
    private final MailService mailService;

    public ReminderScheduler(BookingRepository bookingRepository, ConfigService configService, MailService mailService) {
        this.bookingRepository = bookingRepository;
        this.configService = configService;
        this.mailService = mailService;
    }

    @Scheduled(fixedRate = 15, timeUnit = java.util.concurrent.TimeUnit.MINUTES)
    @Transactional
    public void sendDueReminders() {
        Instant now = Instant.now();
        int remindBeforeHours = configService.getInt("booking.remind_before_hours", 24);
        Instant startThreshold = now.plus(Duration.ofHours(remindBeforeHours));

        for (Booking booking : bookingRepository.findNeedingStartReminder(now, startThreshold)) {
            mailService.sendTemplateAsync("REMIND_BEFORE", booking.getContactEmail(), mailVariables(booking), booking.getId());
            booking.setRemindBeforeSentAt(now);
            log.info("Sent REMIND_BEFORE for booking {}", booking.getCode());
        }

        Instant returnCutoff = now.minus(Duration.ofHours(6)); // don't backfill reminders for long-stale bookings
        for (Booking booking : bookingRepository.findNeedingReturnReminder(now, returnCutoff)) {
            mailService.sendTemplateAsync("REMIND_RETURN", booking.getContactEmail(), mailVariables(booking), booking.getId());
            booking.setRemindReturnSentAt(now);
            log.info("Sent REMIND_RETURN for booking {}", booking.getCode());
        }
    }

    private Map<String, String> mailVariables(Booking booking) {
        Map<String, String> vars = new HashMap<>();
        vars.put("ma_don", booking.getCode());
        vars.put("ten_phong", booking.getRoom().getName());
        vars.put("thoi_gian", MAIL_TIME_FORMAT.format(booking.getStartTime()) + " - "
                + MAIL_TIME_FORMAT.format(booking.getEndTime()));
        vars.put("don_vi", booking.getRequesterUnit());
        return vars;
    }
}
