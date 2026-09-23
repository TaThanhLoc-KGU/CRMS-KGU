package vn.edu.vnkgu.crms.landing;

import vn.edu.vnkgu.crms.landing.dto.LandingSlideDto;
import vn.edu.vnkgu.crms.landing.dto.LandingSlideRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Managing what appears on the public homepage is a branding decision, same as the
 * "Thương hiệu" config group — restricted to ADMIN, unlike Room/Asset CRUD which any
 * staff role can do. */
@RestController
@RequestMapping("/api/v1/landing-slides")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Landing Slides", description = "Ảnh carousel trang chủ (chỉ Admin)")
public class LandingSlideController {

    private final LandingSlideService service;

    public LandingSlideController(LandingSlideService service) {
        this.service = service;
    }

    @GetMapping
    public List<LandingSlideDto> list() {
        return service.listAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LandingSlideDto create(@Valid @RequestBody LandingSlideRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public LandingSlideDto update(@PathVariable Long id, @Valid @RequestBody LandingSlideRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
