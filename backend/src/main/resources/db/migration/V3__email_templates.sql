-- Default email templates (mục 12 của đặc tả). Biến động dùng cú pháp {{ten_bien}},
-- thay thế bằng chuỗi thường (không phải Thymeleaf) — xem MailService.

INSERT INTO email_templates (code, subject, body_html, variables, active) VALUES
(
    'RECEIVED',
    'CRMS-KGU: Đã tiếp nhận đơn mượn phòng {{ma_don}}',
    '<p>Kính gửi {{don_vi}},</p>
<p>Trung tâm Hội nghị đã tiếp nhận đơn đăng ký mượn phòng của quý đơn vị.</p>
<ul>
<li>Mã đơn: <b>{{ma_don}}</b></li>
<li>Phòng: {{ten_phong}}</li>
<li>Thời gian: {{thoi_gian}}</li>
</ul>
<p>Đơn đang được xử lý. Quý đơn vị có thể tra cứu trạng thái bằng mã đơn và email đã
đăng ký trên cổng thông tin.</p>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ma_don","ten_phong","thoi_gian","don_vi"]'::jsonb,
    true
),
(
    'APPROVED',
    'CRMS-KGU: Đơn {{ma_don}} đã được duyệt',
    '<p>Kính gửi {{don_vi}},</p>
<p>Đơn đăng ký mượn phòng <b>{{ma_don}}</b> của quý đơn vị đã được <b>duyệt</b>.</p>
<ul>
<li>Phòng: {{ten_phong}}</li>
<li>Thời gian: {{thoi_gian}}</li>
</ul>
<p>Vui lòng liên hệ Phòng Quản trị Cơ sở Vật chất để nhận bàn giao phòng đúng giờ.</p>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ma_don","ten_phong","thoi_gian","don_vi"]'::jsonb,
    true
),
(
    'REJECTED',
    'CRMS-KGU: Đơn {{ma_don}} bị từ chối',
    '<p>Kính gửi {{don_vi}},</p>
<p>Rất tiếc, đơn đăng ký mượn phòng <b>{{ma_don}}</b> của quý đơn vị đã bị <b>từ
chối</b>.</p>
<ul>
<li>Phòng: {{ten_phong}}</li>
<li>Thời gian: {{thoi_gian}}</li>
<li>Lý do: {{ly_do}}</li>
</ul>
<p>Quý đơn vị có thể liên hệ Phòng Quản trị Cơ sở Vật chất để biết thêm chi tiết hoặc
đăng ký lại với thời gian khác.</p>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ma_don","ten_phong","thoi_gian","don_vi","ly_do"]'::jsonb,
    true
),
(
    'REMIND_BEFORE',
    'CRMS-KGU: Nhắc lịch sử dụng phòng {{ten_phong}}',
    '<p>Kính gửi {{don_vi}},</p>
<p>Đây là email nhắc lịch: đơn <b>{{ma_don}}</b> của quý đơn vị sắp diễn ra.</p>
<ul>
<li>Phòng: {{ten_phong}}</li>
<li>Thời gian: {{thoi_gian}}</li>
</ul>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ma_don","ten_phong","thoi_gian","don_vi"]'::jsonb,
    true
),
(
    'REMIND_RETURN',
    'CRMS-KGU: Nhắc trả phòng {{ten_phong}}',
    '<p>Kính gửi {{don_vi}},</p>
<p>Đơn <b>{{ma_don}}</b> đã đến giờ kết thúc sử dụng phòng {{ten_phong}}. Vui lòng
hoàn tất bàn giao/trả phòng với Phòng Quản trị Cơ sở Vật chất.</p>
<p>Trân trọng,<br/>Trung tâm Hội nghị — Trường Đại học Kiên Giang</p>',
    '["ma_don","ten_phong","don_vi"]'::jsonb,
    true
);
