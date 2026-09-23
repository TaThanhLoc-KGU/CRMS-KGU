-- Tracks whether each reminder has already been sent so the scheduler (which polls
-- periodically) never emails the same booking twice for the same reminder.
ALTER TABLE bookings
    ADD COLUMN remind_before_sent_at TIMESTAMPTZ,
    ADD COLUMN remind_return_sent_at TIMESTAMPTZ;

INSERT INTO configurations (config_key, value, value_type, config_group, description) VALUES
    ('booking.remind_before_hours', '24', 'INT', 'booking', 'Số giờ trước sự kiện để gửi email nhắc lịch');

