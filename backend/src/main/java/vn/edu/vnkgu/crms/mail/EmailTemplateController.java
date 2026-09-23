package vn.edu.vnkgu.crms.mail;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.mail.dto.EmailTemplateDto;
import vn.edu.vnkgu.crms.mail.dto.EmailTemplateRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Only subject/body/active are editable — the 5 template codes are fixed triggers
 * baked into BookingService/MailService (RECEIVED/APPROVED/REJECTED/...), so create
 * and delete aren't exposed: either would either do nothing (unused code) or silently
 * break a notification (deleted code a booking action still looks up).
 */
@RestController
@RequestMapping("/api/v1/email-templates")
@Tag(name = "Email Templates", description = "Mẫu email (admin)")
public class EmailTemplateController {

    private final EmailTemplateRepository repository;

    public EmailTemplateController(EmailTemplateRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<EmailTemplateDto> list() {
        return repository.findAll().stream().map(EmailTemplateDto::from).toList();
    }

    @PutMapping("/{code}")
    public EmailTemplateDto update(@PathVariable String code, @Valid @RequestBody EmailTemplateRequest request) {
        EmailTemplate template = repository.findByCodeAndActiveTrue(code)
                .or(() -> repository.findAll().stream().filter(t -> t.getCode().equals(code)).findFirst())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mẫu email: " + code));
        template.setSubject(request.subject());
        template.setBodyHtml(request.bodyHtml());
        if (request.active() != null) {
            template.setActive(request.active());
        }
        return EmailTemplateDto.from(repository.save(template));
    }
}
