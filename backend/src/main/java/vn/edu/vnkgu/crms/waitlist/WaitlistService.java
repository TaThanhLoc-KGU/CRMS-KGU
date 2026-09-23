package vn.edu.vnkgu.crms.waitlist;

import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.mail.MailService;
import vn.edu.vnkgu.crms.room.Room;
import vn.edu.vnkgu.crms.waitlist.dto.WaitlistEntryDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Real waitlist queue (spec §16 item 11), replacing the P1 placeholder where
 * {@code booking.on_conflict=WAITLIST} just let a second, silently-competing
 * booking through — see BookingService#checkConflict before this change.
 * "Tự báo khi trống" (spec wording) means auto-*notify*, not auto-*book*: freeing a
 * slot emails every WAITING entry that overlaps it and lets them re-submit, rather
 * than creating a booking on their behalf with details that may be stale.
 */
@Service
@Transactional(readOnly = true)
public class WaitlistService {

    private static final DateTimeFormatter MAIL_TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final WaitlistEntryRepository repository;
    private final MailService mailService;

    public WaitlistService(WaitlistEntryRepository repository, MailService mailService) {
        this.repository = repository;
        this.mailService = mailService;
    }

    @Transactional
    public WaitlistEntryDto add(Room room, Instant startTime, Instant endTime, String requesterUnit,
                                 String contactName, String contactEmail, String contactPhone,
                                 Integer expectedAttendees, String purpose) {
        WaitlistEntry entry = new WaitlistEntry();
        entry.setRoom(room);
        entry.setStartTime(startTime);
        entry.setEndTime(endTime);
        entry.setRequesterUnit(requesterUnit);
        entry.setContactName(contactName);
        entry.setContactEmail(contactEmail);
        entry.setContactPhone(contactPhone);
        entry.setExpectedAttendees(expectedAttendees);
        entry.setPurpose(purpose);
        entry.setStatus(WaitlistStatus.WAITING);
        repository.save(entry);
        return WaitlistEntryDto.from(entry);
    }

    /** Called when a booking that was actually blocking a room/time slot (i.e. was
     * APPROVED) stops being so — currently only reachable via BookingService#cancel,
     * since reject() only ever applies to bookings that were never APPROVED. */
    @Transactional
    public void notifyFreedSlot(Room room, Instant startTime, Instant endTime) {
        List<WaitlistEntry> waiting = repository.findWaitingOverlapping(room.getId(), startTime, endTime);
        for (WaitlistEntry entry : waiting) {
            entry.setStatus(WaitlistStatus.NOTIFIED);
            entry.setNotifiedAt(Instant.now());
            repository.save(entry);

            Map<String, String> vars = new HashMap<>();
            vars.put("ten_phong", room.getName());
            vars.put("thoi_gian", MAIL_TIME_FORMAT.format(entry.getStartTime()) + " - "
                    + MAIL_TIME_FORMAT.format(entry.getEndTime()));
            vars.put("don_vi", entry.getRequesterUnit());
            mailService.sendTemplateAsync("WAITLIST_FREED", entry.getContactEmail(), vars, null);
        }
    }

    public List<WaitlistEntryDto> listAdmin(Long roomId, WaitlistStatus status) {
        List<WaitlistEntry> entries = roomId != null
                ? repository.findByRoomIdOrderByCreatedAtAsc(roomId)
                : (status != null ? repository.findByStatusOrderByCreatedAtAsc(status) : repository.findAll());
        return entries.stream()
                .filter(e -> status == null || e.getStatus() == status)
                .map(WaitlistEntryDto::from)
                .toList();
    }

    @Transactional
    public WaitlistEntryDto cancel(Long id) {
        WaitlistEntry entry = repository.findById(id).orElseThrow(() -> NotFoundException.of("Mục chờ", id));
        if (entry.getStatus() != WaitlistStatus.WAITING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mục này không còn ở trạng thái chờ");
        }
        entry.setStatus(WaitlistStatus.CANCELLED);
        repository.save(entry);
        return WaitlistEntryDto.from(entry);
    }
}
