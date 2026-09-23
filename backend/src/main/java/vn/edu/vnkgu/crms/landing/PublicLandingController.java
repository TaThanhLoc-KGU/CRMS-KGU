package vn.edu.vnkgu.crms.landing;

import vn.edu.vnkgu.crms.landing.dto.LandingContentDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/landing")
@Tag(name = "Public Landing", description = "Nội dung trang chủ (công khai, không cần đăng nhập)")
public class PublicLandingController {

    private final LandingSlideService service;

    public PublicLandingController(LandingSlideService service) {
        this.service = service;
    }

    @GetMapping
    public LandingContentDto get() {
        return service.publicContent();
    }
}
