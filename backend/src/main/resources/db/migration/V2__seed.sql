-- CRMS-KGU seed data: roles, default admin account, lookup catalogs,
-- the real KGU Conference Center room list, and default configuration values.

-- =========================================================================
-- Roles & default admin account
-- =========================================================================

INSERT INTO roles (code, name, permissions) VALUES
    ('ADMIN',    'Quản trị viên', '{}'::jsonb),
    ('OFFICER',  'Người lập phiếu', '{}'::jsonb),
    ('APPROVER', 'Người duyệt', '{}'::jsonb);

-- Default admin account. Username: admin / Password: Admin@123
-- CHANGE THIS PASSWORD immediately after the first login in a real deployment.
INSERT INTO users (username, password_hash, full_name, email, unit, role_id, active)
VALUES (
    'admin',
    '$2b$10$nI9YUAYdjojH9xnP0N3Dxe4MWbH4yhbGrxsBEFrsz6Hl2PBEmV/Ki',
    'Quản trị hệ thống',
    'admin@vnkgu.edu.vn',
    'Phòng Quản trị Cơ sở Vật chất',
    (SELECT id FROM roles WHERE code = 'ADMIN'),
    true
);

-- =========================================================================
-- Setup styles (kiểu bố trí)
-- =========================================================================

INSERT INTO setup_styles (code, name, description, icon) VALUES
    ('THEATER',       'Rạp hát',        'Ghế xếp hàng hướng về sân khấu, sức chứa tối đa', 'theater'),
    ('CLASSROOM',     'Lớp học',        'Bàn ghế xếp hàng hướng lên, có mặt bàn để viết',  'classroom'),
    ('U_SHAPE',       'Chữ U',          'Bàn xếp hình chữ U, phù hợp thảo luận',           'u-shape'),
    ('ROUND_TABLE',   'Bàn tròn',       'Các bàn tròn cho tiệc/hội thảo nhóm',              'round-table'),
    ('HOLLOW_SQUARE', 'Hình vuông rỗng','Bàn xếp thành khối vuông rỗng ở giữa',             'hollow-square');

-- =========================================================================
-- Equipment catalog (nhu cầu / thiết bị mượn thêm)
-- =========================================================================

INSERT INTO equipment_catalog (code, name, unit, is_shared, default_quantity, active) VALUES
    ('PROJECTOR_MOBILE', 'Máy chiếu di động',       'cái', true,  1, true),
    ('MIC_WIRELESS',     'Mic không dây',           'cái', true,  2, true),
    ('DRINKING_WATER',   'Nước uống',               'chai',false, 20, true),
    ('NAME_TAG',         'Bảng tên',                'cái', false, 20, true),
    ('ONLINE_ZOOM',      'Hỗ trợ trực tuyến Zoom',  'lượt',true,  1, true);

-- =========================================================================
-- Rooms — Trung tâm Hội nghị KGU (tòa nhà 11 tầng, tầng 5 & 6)
-- =========================================================================

INSERT INTO rooms (code, name, building, floor, capacity, description, status) VALUES
    ('TT-TAM', 'Phòng hội thảo Tận tâm',              'Trung tâm Hội nghị', 5, 35,  'Giá trị cốt lõi', 'ACTIVE'),
    ('TT-UYT', 'Phòng hội thảo Uy tín',                'Trung tâm Hội nghị', 5, 35,  'Giá trị cốt lõi', 'ACTIVE'),
    ('TT-CHL', 'Phòng hội thảo Chất lượng',            'Trung tâm Hội nghị', 5, 31,  'Giá trị cốt lõi', 'ACTIVE'),
    ('TT-HNH', 'Phòng hội thảo Hội nhập',              'Trung tâm Hội nghị', 5, 31,  'Giá trị cốt lõi', 'ACTIVE'),
    ('TT-DME', 'Phòng hội thảo Đổi mới',               'Trung tâm Hội nghị', 5, 23,  'Mục tiêu', 'ACTIVE'),
    ('T5-HOP', 'Phòng họp tầng 5',                     'Trung tâm Hội nghị', 5, 65,  NULL, 'ACTIVE'),
    ('T5-TRT', 'Phòng họp trực tuyến',                 'Trung tâm Hội nghị', 5, 15,  'Hỗ trợ họp online', 'ACTIVE'),
    ('T5-KNS', 'Không gian Khởi nghiệp & ĐMST',        'Trung tâm Hội nghị', 5, 100, 'Sự kiện lớn', 'ACTIVE'),
    ('T6-HOP', 'Phòng họp tầng 6',                     'Trung tâm Hội nghị', 6, 30,  'Họp quan trọng của trường', 'ACTIVE'),
    ('T6-KHT', 'Phòng Khánh tiết',                     'Trung tâm Hội nghị', 6, NULL,'Đón đoàn khách quốc tế/trong nước', 'ACTIVE'),
    ('T6-BTV', 'Phòng họp Ban Thường vụ',              'Trung tâm Hội nghị', 6, NULL,'Họp Ban Thường vụ Đảng ủy & lãnh đạo', 'ACTIVE');

-- =========================================================================
-- Default configuration values (mục 10 của đặc tả)
-- =========================================================================

INSERT INTO configurations (config_key, value, value_type, config_group, description) VALUES
    ('booking.min_lead_hours',           '48',    'INT',  'booking',  'Thời gian tối thiểu phải đăng ký trước (giờ)'),
    ('booking.max_advance_days',         '90',    'INT',  'booking',  'Đăng ký sớm nhất bao nhiêu ngày'),
    ('booking.on_conflict',              'BLOCK', 'ENUM', 'booking',  'BLOCK / WAITLIST khi trùng lịch'),
    ('booking.require_approval_levels',  '1',     'INT',  'booking',  'Số cấp duyệt'),
    ('booking.allow_public_submit',      'true',  'BOOL', 'booking',  'Bật/tắt đăng ký công khai'),
    ('working_hours.start',              '07:00', 'TIME', 'schedule', 'Giờ bắt đầu nhận đặt phòng'),
    ('working_hours.end',                '17:00', 'TIME', 'schedule', 'Giờ kết thúc nhận đặt phòng'),
    ('working_hours.days',               'MON,TUE,WED,THU,FRI,SAT', 'LIST', 'schedule', 'Ngày làm việc trong tuần'),
    ('upload.max_size_mb',               '20',    'INT',  'upload',   'Dung lượng tối đa mỗi file (MB)'),
    ('upload.allowed_types',             'pdf,doc,docx,jpg,png', 'LIST', 'upload', 'Định dạng tệp cho phép'),
    ('mail.from_name',                   'Trung tâm Hội nghị KGU', 'STRING', 'mail', 'Tên người gửi email'),
    ('mail.from_addr',                   'noreply@vnkgu.edu.vn',   'STRING', 'mail', 'Địa chỉ email người gửi'),
    ('calendar.public_show_pending',     'false', 'BOOL', 'calendar', 'Hiện đơn chờ duyệt trên lịch công khai'),
    ('recaptcha.enabled',                'false', 'BOOL', 'security', 'Bật/tắt reCAPTCHA trên form công khai'),
    ('recaptcha.site_key',               '',      'STRING','security', 'Site key reCAPTCHA'),
    ('org.name',                         'Trường Đại học Kiên Giang', 'STRING', 'branding', 'Tên đơn vị chủ quản'),
    ('org.logo',                         '',      'STRING', 'branding', 'URL logo hiển thị trên phiếu & email');

-- =========================================================================
-- Working hours: Monday(1)..Saturday(6) 07:00-17:00, Sunday(7) off
-- =========================================================================

INSERT INTO working_hours (day_of_week, start_time, end_time, is_working_day) VALUES
    (1, '07:00', '17:00', true),
    (2, '07:00', '17:00', true),
    (3, '07:00', '17:00', true),
    (4, '07:00', '17:00', true),
    (5, '07:00', '17:00', true),
    (6, '07:00', '17:00', true),
    (7, '00:00', '00:00', false);
