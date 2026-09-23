package vn.edu.vnkgu.crms.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, Long> {
    boolean existsByHolidayDate(LocalDate date);
}
