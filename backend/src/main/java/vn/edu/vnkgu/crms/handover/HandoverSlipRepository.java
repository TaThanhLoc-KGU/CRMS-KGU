package vn.edu.vnkgu.crms.handover;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HandoverSlipRepository extends JpaRepository<HandoverSlip, Long> {
    List<HandoverSlip> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    Optional<HandoverSlip> findFirstByBookingIdAndTypeOrderByCreatedAtDesc(Long bookingId, HandoverType type);

    boolean existsBySlipNo(String slipNo);

    long countBySlipNoStartingWith(String prefix);
}
