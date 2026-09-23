package vn.edu.vnkgu.crms.handover;

import vn.edu.vnkgu.crms.handover.dto.HandoverConfirmInfoDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * What a phone camera actually hits after scanning a handover slip's QR code — no
 * JWT (see {@code SecurityConfig.PUBLIC_PATHS}, already permits all of
 * {@code /api/v1/public/**}), authorization comes entirely from the signed token
 * in the query string. See {@link HandoverConfirmTokenService}.
 */
@RestController
@RequestMapping("/api/v1/public/handover-confirm")
@Tag(name = "Handover QR Confirm", description = "Xác nhận nhận/trả phòng qua quét QR (công khai, dùng token ký)")
public class HandoverConfirmController {

    private final HandoverService handoverService;

    public HandoverConfirmController(HandoverService handoverService) {
        this.handoverService = handoverService;
    }

    @GetMapping("/{slipId}")
    public HandoverConfirmInfoDto info(@PathVariable Long slipId, @RequestParam String token) {
        return handoverService.getConfirmInfo(slipId, token);
    }

    @PostMapping("/{slipId}")
    public HandoverConfirmInfoDto confirm(@PathVariable Long slipId, @RequestParam String token,
                                           HttpServletRequest request) {
        return handoverService.confirm(slipId, token, clientIp(request));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
