package vn.edu.vnkgu.crms.landing.dto;

import vn.edu.vnkgu.crms.landing.LandingSlide;

public record LandingSlideDto(
        Long id,
        String imageUrl,
        String caption,
        int sortOrder,
        boolean active
) {
    public static LandingSlideDto from(LandingSlide slide) {
        return new LandingSlideDto(slide.getId(), slide.getImageUrl(), slide.getCaption(),
                slide.getSortOrder(), slide.isActive());
    }
}
