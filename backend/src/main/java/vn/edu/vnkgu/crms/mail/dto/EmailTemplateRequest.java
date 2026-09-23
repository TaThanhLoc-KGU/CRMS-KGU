package vn.edu.vnkgu.crms.mail.dto;

import jakarta.validation.constraints.NotBlank;

public record EmailTemplateRequest(
        @NotBlank String subject,
        @NotBlank String bodyHtml,
        Boolean active
) {
}
