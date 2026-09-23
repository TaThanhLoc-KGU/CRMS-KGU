package vn.edu.vnkgu.crms.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    Optional<Booking> findByCodeAndContactEmailIgnoreCase(String code, String contactEmail);

    boolean existsByCode(String code);

    long countByCodeStartingWith(String prefix);

    @Query("""
            select b from Booking b
            where b.room.id = :roomId
              and b.status = 'APPROVED'
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    List<Booking> findApprovedOverlapping(@Param("roomId") Long roomId,
                                           @Param("startTime") Instant startTime,
                                           @Param("endTime") Instant endTime);

    @Query("""
            select b from Booking b
            where b.status in ('APPROVED', 'SLIP_ISSUED', 'IN_USE')
              and b.startTime < :to and b.endTime > :from
              and (:roomId is null or b.room.id = :roomId)
            """)
    List<Booking> findForPublicCalendar(@Param("from") Instant from, @Param("to") Instant to,
                                         @Param("roomId") Long roomId);

    @Query("""
            select b from Booking b
            where b.status in ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SLIP_ISSUED', 'IN_USE')
              and b.startTime < :to and b.endTime > :from
              and (:roomId is null or b.room.id = :roomId)
            """)
    List<Booking> findForInternalCalendar(@Param("from") Instant from, @Param("to") Instant to,
                                           @Param("roomId") Long roomId);

    @Query("""
            select b from Booking b
            where b.status in ('APPROVED', 'SLIP_ISSUED')
              and b.remindBeforeSentAt is null
              and b.startTime <= :threshold and b.startTime > :now
            """)
    List<Booking> findNeedingStartReminder(@Param("now") Instant now, @Param("threshold") Instant threshold);

    @Query("""
            select b from Booking b
            where b.status in ('APPROVED', 'SLIP_ISSUED', 'IN_USE')
              and b.remindReturnSentAt is null
              and b.endTime <= :now and b.endTime > :cutoff
            """)
    List<Booking> findNeedingReturnReminder(@Param("now") Instant now, @Param("cutoff") Instant cutoff);
}
