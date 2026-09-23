package vn.edu.vnkgu.crms.landing;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.config.domain.ConfigService;
import vn.edu.vnkgu.crms.landing.dto.LandingContentDto;
import vn.edu.vnkgu.crms.landing.dto.LandingSlideDto;
import vn.edu.vnkgu.crms.landing.dto.LandingSlideRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class LandingSlideService {

    private final LandingSlideRepository repository;
    private final ConfigService configService;

    public LandingSlideService(LandingSlideRepository repository, ConfigService configService) {
        this.repository = repository;
        this.configService = configService;
    }

    public LandingContentDto publicContent() {
        List<LandingSlideDto> slides = repository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(LandingSlideDto::from).toList();
        return new LandingContentDto(
                configService.getString("landing.eyebrow", "Trường Đại học Kiên Giang"),
                configService.getString("landing.headline", "Đặt phòng họp nhanh gọn, không cần gọi điện"),
                configService.getString("landing.subheadline", ""),
                slides);
    }

    public List<LandingSlideDto> listAdmin() {
        return repository.findAllByOrderBySortOrderAsc().stream().map(LandingSlideDto::from).toList();
    }

    @Transactional
    public LandingSlideDto create(LandingSlideRequest request) {
        LandingSlide slide = new LandingSlide();
        apply(slide, request);
        repository.save(slide);
        return LandingSlideDto.from(slide);
    }

    @Transactional
    public LandingSlideDto update(Long id, LandingSlideRequest request) {
        LandingSlide slide = repository.findById(id).orElseThrow(() -> NotFoundException.of("Ảnh trang chủ", id));
        apply(slide, request);
        repository.save(slide);
        return LandingSlideDto.from(slide);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw NotFoundException.of("Ảnh trang chủ", id);
        }
        repository.deleteById(id);
    }

    private void apply(LandingSlide slide, LandingSlideRequest request) {
        slide.setImageUrl(request.imageUrl());
        slide.setCaption(request.caption());
        slide.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        slide.setActive(request.active() == null || request.active());
    }
}
