package vn.edu.vnkgu.crms.landing.dto;

import java.util.List;

/** What the public landing page fetches in one call: the editable hero text
 * (stored in `configurations`, group 'landing') plus the active carousel slides. */
public record LandingContentDto(
        String eyebrow,
        String headline,
        String subheadline,
        List<LandingSlideDto> slides
) {
}
