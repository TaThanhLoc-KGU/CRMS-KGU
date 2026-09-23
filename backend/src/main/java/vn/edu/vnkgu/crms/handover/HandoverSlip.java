package vn.edu.vnkgu.crms.handover;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.security.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "handover_slips")
public class HandoverSlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "slip_no", nullable = false, unique = true, length = 30)
    private String slipNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private HandoverType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "borrower_name", nullable = false, length = 150)
    private String borrowerName;

    @Column(name = "borrower_unit", length = 200)
    private String borrowerUnit;

    @Column(name = "borrower_phone", length = 30)
    private String borrowerPhone;

    @Column(name = "handover_time", nullable = false)
    private Instant handoverTime;

    @Column(columnDefinition = "text")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HandoverStatus status = HandoverStatus.ISSUED;

    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "slip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HandoverItem> items = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public String getSlipNo() {
        return slipNo;
    }

    public void setSlipNo(String slipNo) {
        this.slipNo = slipNo;
    }

    public HandoverType getType() {
        return type;
    }

    public void setType(HandoverType type) {
        this.type = type;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getBorrowerName() {
        return borrowerName;
    }

    public void setBorrowerName(String borrowerName) {
        this.borrowerName = borrowerName;
    }

    public String getBorrowerUnit() {
        return borrowerUnit;
    }

    public void setBorrowerUnit(String borrowerUnit) {
        this.borrowerUnit = borrowerUnit;
    }

    public String getBorrowerPhone() {
        return borrowerPhone;
    }

    public void setBorrowerPhone(String borrowerPhone) {
        this.borrowerPhone = borrowerPhone;
    }

    public Instant getHandoverTime() {
        return handoverTime;
    }

    public void setHandoverTime(Instant handoverTime) {
        this.handoverTime = handoverTime;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public HandoverStatus getStatus() {
        return status;
    }

    public void setStatus(HandoverStatus status) {
        this.status = status;
    }

    public String getPdfPath() {
        return pdfPath;
    }

    public void setPdfPath(String pdfPath) {
        this.pdfPath = pdfPath;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<HandoverItem> getItems() {
        return items;
    }
}
