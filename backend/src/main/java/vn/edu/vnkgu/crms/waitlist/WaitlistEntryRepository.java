package vn.edu.vnkgu.crms.waitlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Long> {

    List<WaitlistEntry> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    List<WaitlistEntry> findByStatusOrderByCreatedAtAsc(WaitlistStatus status);

    @Query("""
            select w from WaitlistEntry w
            where w.room.id = :roomId
              and w.status = 'WAITING'
              and w.startTime < :endTime and w.endTime > :startTime
            """)
    List<WaitlistEntry> findWaitingOverlapping(@Param("roomId") Long roomId,
                                                @Param("startTime") Instant startTime,
                                                @Param("endTime") Instant endTime);
}
