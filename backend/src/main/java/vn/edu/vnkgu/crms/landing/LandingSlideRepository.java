package vn.edu.vnkgu.crms.landing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LandingSlideRepository extends JpaRepository<LandingSlide, Long> {
    List<LandingSlide> findAllByOrderBySortOrderAsc();

    List<LandingSlide> findByActiveTrueOrderBySortOrderAsc();
}
