package vn.edu.vnkgu.crms.config.domain;

import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.config.domain.dto.ConfigItemDto;
import vn.edu.vnkgu.crms.config.domain.dto.SmtpTestRequest;
import vn.edu.vnkgu.crms.mail.MailService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Configuration", description = "Cấu hình hệ thống (chỉ Admin)")
public class ConfigController {

    private final ConfigService configService;
    private final MailService mailService;

    public ConfigController(ConfigService configService, MailService mailService) {
        this.configService = configService;
        this.mailService = mailService;
    }

    @PostMapping("/smtp/test")
    public Map<String, String> testSmtp(@Valid @RequestBody SmtpTestRequest request) {
        try {
            mailService.sendRaw(request.toEmail(), "CRMS-KGU: Email thử nghiệm",
                    "<p>Đây là email thử nghiệm cấu hình SMTP từ hệ thống CRMS-KGU.</p>");
            return Map.of("status", "SENT");
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Gửi email thử thất bại: " + ex.getMessage());
        }
    }

    @GetMapping
    public Map<String, List<ConfigItemDto>> list() {
        Map<String, List<ConfigItemDto>> result = new java.util.LinkedHashMap<>();
        configService.listGroupedAll().forEach((group, items) ->
                result.put(group, items.stream().map(ConfigItemDto::from).toList()));
        return result;
    }

    @PutMapping
    public Map<String, List<ConfigItemDto>> update(@RequestBody Map<String, String> values) {
        configService.update(values);
        return list();
    }
}
