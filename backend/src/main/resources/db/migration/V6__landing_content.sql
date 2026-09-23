-- Makes the public landing page's hero content admin-editable instead of hardcoded
-- in the frontend: short text through the existing configurations mechanism (a new
-- 'landing' group, same as any other operational text like mail.from_name), and a
-- small ordered list of carousel images through their own table (same shape as
-- room_images, but top-level — not attached to any one room).

CREATE TABLE landing_slides (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    image_url  VARCHAR(500) NOT NULL,
    caption    VARCHAR(255),
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- No seed rows: this project has no real photography yet (every seeded room's
-- thumbnail_url is already null — see V2__seed.sql) and a placeholder stock-photo
-- URL would silently break the day it 404s. LandingPage.tsx renders a plain neutral
-- placeholder until an admin adds real slides at Quản trị > Nội dung trang chủ.

INSERT INTO configurations (config_key, value, value_type, config_group, description) VALUES
    ('landing.eyebrow', 'Trường Đại học Kiên Giang', 'STRING', 'landing', 'Dòng chữ nhỏ phía trên tiêu đề trang chủ'),
    ('landing.headline', 'Đặt phòng họp nhanh gọn, không cần gọi điện', 'STRING', 'landing', 'Tiêu đề chính của trang chủ'),
    ('landing.subheadline', 'Xem lịch trống, gửi đơn đăng ký mượn phòng của Trung tâm Hội nghị, và nhận kết quả duyệt qua email — toàn bộ trên một trang.', 'TEXT', 'landing', 'Đoạn mô tả ngắn dưới tiêu đề trang chủ');
