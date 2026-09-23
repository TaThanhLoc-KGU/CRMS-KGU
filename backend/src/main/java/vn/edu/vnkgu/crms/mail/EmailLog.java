package vn.edu.vnkgu.crms.mail;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Deliberately has no JPA relation to Booking: mail is a leaf package other
 * modules call into (Booking -> Mail), so this holds the raw id rather than
 * creating a dependency back from mail to booking.
 */
@Entity
@Table(name = "email_logs")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "to_email", nullable = false, length = 150)
    private String toEmail;

    @Column(name = "template_code", nullable = false, length = 50)
    private String templateCode;

    @Column(length = 255)
    private String subject;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "text")
    private String error;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    public Long getId() {
        return id;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public void setToEmail(String toEmail) {
        this.toEmail = toEmail;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setError(String error) {
        this.error = error;
    }
}
