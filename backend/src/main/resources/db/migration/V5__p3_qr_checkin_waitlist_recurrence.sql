-- P3: real QR check-in/out confirmation, a real waitlist queue (replacing the P1
-- "just accept the submission anyway" placeholder), and recurring bookings.

-- Records when/where a handover slip's QR code was actually scanned and confirmed
-- on site — distinct from handover_time, which is when the office prepared the
-- paperwork. NULL until confirmed.
ALTER TABLE handover_slips
    ADD COLUMN confirmed_at TIMESTAMPTZ,
    ADD COLUMN confirmed_ip VARCHAR(64);

-- A shared tag for bookings created together as one recurring series (e.g. weekly
-- club meeting). NULL for ordinary one-off bookings. Each occurrence is still its
-- own independent row, checked against no_overlap_per_room individually — a
-- recurring series is just "submit() called N times", not a new conflict model.
ALTER TABLE bookings
    ADD COLUMN recurrence_group VARCHAR(40);

CREATE INDEX idx_bookings_recurrence_group ON bookings(recurrence_group) WHERE recurrence_group IS NOT NULL;

-- Real waitlist: when booking.on_conflict=WAITLIST and the requested slot already
-- has an APPROVED booking, the request goes here instead of creating a second,
-- silently-competing SUBMITTED booking for the same room/time. WaitlistScheduler
-- (a lightweight event, not a poller — see BookingService.notifyWaitlist) emails
-- WAITING entries once the conflicting booking is no longer APPROVED.
CREATE TABLE waitlist_entries (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id            BIGINT       NOT NULL REFERENCES rooms(id),
    start_time         TIMESTAMPTZ  NOT NULL,
    end_time           TIMESTAMPTZ  NOT NULL,
    requester_unit     VARCHAR(200) NOT NULL,
    contact_name       VARCHAR(150) NOT NULL,
    contact_email      VARCHAR(150) NOT NULL,
    contact_phone      VARCHAR(30),
    expected_attendees INT,
    purpose            TEXT,
    status             VARCHAR(20)  NOT NULL DEFAULT 'WAITING'
                            CHECK (status IN ('WAITING','NOTIFIED','CANCELLED')),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    notified_at        TIMESTAMPTZ,
    CONSTRAINT chk_waitlist_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_waitlist_room_time ON waitlist_entries(room_id, start_time, end_time) WHERE status = 'WAITING';

INSERT INTO email_templates (code, subject, body_html, variables, active) VALUES
(
    'WAITLIST_FREED',
    'CRMS-KGU: Phòng {{ten_phong}} đã trống trong khung giờ bạn chờ',
    '<p>Kính gửi {{don_vi}},</p>
<p>Trước đó quý đơn vị đã đăng ký chờ phòng <b>{{ten_phong}}</b> vào khung giờ
{{thoi_gian}} nhưng phòng đã có đơn khác được duyệt. Đơn đó vừa được hủy/từ chối
nên khung giờ này hiện đã trống.</p>
<p>Nếu quý đơn vị vẫn còn nhu cầu, vui lòng đăng ký lại sớm trên cổng thông tin vì
chỗ trống có thể được đơn vị khác đặt trước.</p>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ten_phong","thoi_gian","don_vi"]'::jsonb,
    true
);
