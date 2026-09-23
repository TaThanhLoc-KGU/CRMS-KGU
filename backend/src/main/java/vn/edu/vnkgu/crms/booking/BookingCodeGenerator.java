package vn.edu.vnkgu.crms.booking;

import org.springframework.stereotype.Component;

import java.time.Year;

@Component
public class BookingCodeGenerator {

    private final BookingRepository bookingRepository;

    public BookingCodeGenerator(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    /** Format: CRMS-2026-000123. Not perfectly race-proof under heavy concurrency —
     * the caller retries on a unique-constraint violation, which is adequate at this
     * system's expected submission volume (a booking portal, not a ticketing system). */
    public String next() {
        String prefix = "CRMS-" + Year.now(java.time.ZoneOffset.UTC) + "-";
        long count = bookingRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%06d", count + 1);
    }
}
