package vn.edu.vnkgu.crms.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {
    Optional<WorkingHours> findByDayOfWeek(int dayOfWeek);
}
