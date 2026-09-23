package vn.edu.vnkgu.crms.waitlist;

import vn.edu.vnkgu.crms.waitlist.dto.WaitlistEntryDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/waitlist")
@Tag(name = "Waitlist", description = "Danh sách chờ khi phòng bận (nội bộ)")
public class WaitlistController {

    private final WaitlistService waitlistService;

    public WaitlistController(WaitlistService waitlistService) {
        this.waitlistService = waitlistService;
    }

    @GetMapping
    public List<WaitlistEntryDto> list(@RequestParam(required = false) Long roomId,
                                        @RequestParam(required = false) WaitlistStatus status) {
        return waitlistService.listAdmin(roomId, status);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public WaitlistEntryDto cancel(@PathVariable Long id) {
        return waitlistService.cancel(id);
    }
}
