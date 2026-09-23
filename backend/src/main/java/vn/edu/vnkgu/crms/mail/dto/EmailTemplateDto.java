package vn.edu.vnkgu.crms.mail.dto;

import vn.edu.vnkgu.crms.mail.EmailTemplate;

public record EmailTemplateDto(Long id, String code, String subject, String bodyHtml, boolean active) {
    public static EmailTemplateDto from(EmailTemplate t) {
        return new EmailTemplateDto(t.getId(), t.getCode(), t.getSubject(), t.getBodyHtml(), t.isActive());
    }
}
