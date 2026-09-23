package vn.edu.vnkgu.crms.mail;

import vn.edu.vnkgu.crms.config.domain.ConfigService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final EmailTemplateRepository templateRepository;
    private final EmailLogRepository logRepository;
    private final ConfigService configService;

    public MailService(JavaMailSender mailSender, EmailTemplateRepository templateRepository,
                        EmailLogRepository logRepository, ConfigService configService) {
        this.mailSender = mailSender;
        this.templateRepository = templateRepository;
        this.logRepository = logRepository;
        this.configService = configService;
    }

    /** Fire-and-forget send used by the booking workflow (received/approved/rejected). */
    @Async
    public void sendTemplateAsync(String templateCode, String toEmail, Map<String, String> variables, Long bookingId) {
        sendTemplate(templateCode, toEmail, variables, bookingId);
    }

    /** Synchronous variant so the "send test email" button can report success/failure immediately. */
    @Transactional
    public void sendTemplate(String templateCode, String toEmail, Map<String, String> variables, Long bookingId) {
        EmailTemplate template = templateRepository.findByCodeAndActiveTrue(templateCode).orElse(null);
        if (template == null) {
            logResult(bookingId, toEmail, templateCode, null, "FAILED", "Không tìm thấy mẫu email: " + templateCode);
            return;
        }
        String subject = substitute(template.getSubject(), variables);
        String body = substitute(template.getBodyHtml(), variables);
        try {
            sendRaw(toEmail, subject, body);
            logResult(bookingId, toEmail, templateCode, subject, "SENT", null);
        } catch (Exception ex) {
            log.warn("Failed to send email template {} to {}: {}", templateCode, toEmail, ex.getMessage());
            logResult(bookingId, toEmail, templateCode, subject, "FAILED", ex.getMessage());
        }
    }

    /** Used directly by the SMTP "send test email" endpoint — no template/log involved. */
    public void sendRaw(String toEmail, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        String fromName = configService.getString("mail.from_name", "Trung tâm Hội nghị KGU");
        String fromAddr = configService.getString("mail.from_addr", "noreply@vnkgu.edu.vn");
        helper.setFrom(fromAddr, fromName);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    private void logResult(Long bookingId, String toEmail, String templateCode, String subject,
                            String status, String error) {
        EmailLog entry = new EmailLog();
        entry.setBookingId(bookingId);
        entry.setToEmail(toEmail);
        entry.setTemplateCode(templateCode);
        entry.setSubject(subject);
        entry.setStatus(status);
        entry.setError(error);
        logRepository.save(entry);
    }

    private String substitute(String text, Map<String, String> variables) {
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() == null ? "" : entry.getValue());
        }
        return result;
    }
}
