-- CRMS-KGU initial schema
-- Conventions: snake_case, timestamptz for instants, BIGINT IDENTITY primary keys,
-- explicit foreign keys, anti-overlap enforced at the database layer (see bookings below).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================================
-- Auth: roles & users
-- =========================================================================

CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    permissions JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    unit          VARCHAR(150),
    role_id       BIGINT       NOT NULL REFERENCES roles(id),
    active        BOOLEAN      NOT NULL DEFAULT true,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role_id ON users(role_id);

-- =========================================================================
-- Rooms & setup styles
-- =========================================================================

CREATE TABLE rooms (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                    VARCHAR(30)   NOT NULL UNIQUE,
    name                    VARCHAR(150)  NOT NULL,
    building                VARCHAR(150),
    floor                   INT,
    capacity                INT,
    area_m2                 NUMERIC(8,2),
    description             TEXT,
    thumbnail_url           VARCHAR(500),
    status                  VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','MAINTENANCE','DISABLED')),
    min_lead_hours_override INT,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE room_images (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id    BIGINT       NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    caption    VARCHAR(255),
    sort_order INT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_room_images_room_id ON room_images(room_id);

CREATE TABLE setup_styles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(100)
);

CREATE TABLE room_setup_styles (
    room_id               BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    setup_style_id        BIGINT NOT NULL REFERENCES setup_styles(id) ON DELETE CASCADE,
    max_capacity_for_style INT,
    PRIMARY KEY (room_id, setup_style_id)
);

-- =========================================================================
-- Assets (fixed/movable equipment attached to a room) & the equipment catalog
-- used for "borrow extra equipment" requests on a booking
-- =========================================================================

CREATE TABLE assets (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id        BIGINT       NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    asset_code     VARCHAR(50)  NOT NULL UNIQUE,
    name           VARCHAR(150) NOT NULL,
    category       VARCHAR(100),
    quantity       INT          NOT NULL DEFAULT 1,
    unit           VARCHAR(30),
    condition      VARCHAR(30)  NOT NULL DEFAULT 'GOOD',
    purchase_year  INT,
    is_movable     BOOLEAN      NOT NULL DEFAULT false,
    note           TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_room_id ON assets(room_id);

CREATE TABLE equipment_catalog (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(50)  NOT NULL UNIQUE,
    name             VARCHAR(150) NOT NULL,
    unit             VARCHAR(30),
    is_shared        BOOLEAN      NOT NULL DEFAULT false,
    default_quantity INT          NOT NULL DEFAULT 1,
    active           BOOLEAN      NOT NULL DEFAULT true
);

-- =========================================================================
-- Bookings and the database-level anti-overlap guarantee
-- =========================================================================

CREATE TABLE bookings (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                VARCHAR(30)  NOT NULL UNIQUE,
    room_id             BIGINT       NOT NULL REFERENCES rooms(id),
    setup_style_id      BIGINT       REFERENCES setup_styles(id),
    requester_unit      VARCHAR(200) NOT NULL,
    contact_name        VARCHAR(150) NOT NULL,
    contact_email       VARCHAR(150) NOT NULL,
    contact_phone       VARCHAR(30),
    start_time          TIMESTAMPTZ  NOT NULL,
    end_time            TIMESTAMPTZ  NOT NULL,
    expected_attendees  INT,
    purpose             TEXT,
    extra_requirements  TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'SUBMITTED'
                            CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED',
                                               'CANCELLED','SLIP_ISSUED','IN_USE','RETURNED','CLOSED')),
    submitted_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    decided_at          TIMESTAMPTZ,
    cancel_reason       TEXT,
    source              VARCHAR(20)  NOT NULL DEFAULT 'PUBLIC' CHECK (source IN ('PUBLIC','INTERNAL')),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_booking_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- The database itself refuses two APPROVED bookings on the same room with
-- overlapping [start_time, end_time) ranges — this holds even under concurrent
-- approvals (race conditions), which an application-level check cannot guarantee.
ALTER TABLE bookings
    ADD CONSTRAINT no_overlap_per_room
    EXCLUDE USING gist (
        room_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status = 'APPROVED');

CREATE TABLE booking_equipments (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id   BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id BIGINT NOT NULL REFERENCES equipment_catalog(id),
    quantity     INT    NOT NULL DEFAULT 1,
    note         TEXT
);

CREATE INDEX idx_booking_equipments_booking_id ON booking_equipments(booking_id);

CREATE TABLE booking_attachments (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id        BIGINT       NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    storage_path      VARCHAR(500) NOT NULL,
    mime_type         VARCHAR(150),
    size_bytes        BIGINT,
    preview_pdf_path  VARCHAR(500),
    uploaded_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_attachments_booking_id ON booking_attachments(booking_id);

CREATE TABLE approvals (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id  BIGINT      NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    level       INT         NOT NULL DEFAULT 1,
    approver_id BIGINT      NOT NULL REFERENCES users(id),
    decision    VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
    comment     TEXT,
    decided_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approvals_booking_id ON approvals(booking_id);

-- =========================================================================
-- Handover slips (borrow / return)
-- =========================================================================

CREATE TABLE handover_slips (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id     BIGINT       NOT NULL REFERENCES bookings(id),
    slip_no        VARCHAR(30)  NOT NULL UNIQUE,
    type           VARCHAR(10)  NOT NULL CHECK (type IN ('BORROW','RETURN')),
    created_by     BIGINT       NOT NULL REFERENCES users(id),
    borrower_name  VARCHAR(150) NOT NULL,
    borrower_unit  VARCHAR(200),
    borrower_phone VARCHAR(30),
    handover_time  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    note           TEXT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    pdf_path       VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_handover_slips_booking_id ON handover_slips(booking_id);

CREATE TABLE handover_items (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slip_id           BIGINT       NOT NULL REFERENCES handover_slips(id) ON DELETE CASCADE,
    asset_id          BIGINT       REFERENCES assets(id),
    item_name         VARCHAR(150) NOT NULL,
    quantity          INT          NOT NULL DEFAULT 1,
    condition_before  VARCHAR(30),
    condition_after   VARCHAR(30),
    note              TEXT
);

CREATE INDEX idx_handover_items_slip_id ON handover_items(slip_id);

-- =========================================================================
-- Configuration, email templates/logs, audit log, working hours & holidays
-- =========================================================================

-- Spec calls the primary key "key" and groups by "group"; both are reserved/
-- ambiguous SQL identifiers, so they are stored here as config_key/config_group.
CREATE TABLE configurations (
    config_key   VARCHAR(100) PRIMARY KEY,
    value        TEXT,
    value_type   VARCHAR(20)  NOT NULL DEFAULT 'STRING',
    config_group VARCHAR(50)  NOT NULL,
    description  TEXT,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE email_templates (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code      VARCHAR(50)  NOT NULL UNIQUE,
    subject   VARCHAR(255) NOT NULL,
    body_html TEXT         NOT NULL,
    variables JSONB        NOT NULL DEFAULT '[]'::jsonb,
    active    BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE email_logs (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id    BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    to_email      VARCHAR(150) NOT NULL,
    template_code VARCHAR(50)  NOT NULL,
    subject       VARCHAR(255),
    status        VARCHAR(20)  NOT NULL CHECK (status IN ('SENT','FAILED')),
    error         TEXT,
    sent_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_booking_id ON email_logs(booking_id);

CREATE TABLE audit_logs (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    entity     VARCHAR(100) NOT NULL,
    entity_id  BIGINT,
    detail     JSONB,
    ip         VARCHAR(50),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

CREATE TABLE public_holidays (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    name         VARCHAR(150) NOT NULL
);

CREATE TABLE working_hours (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    day_of_week    INT     NOT NULL UNIQUE CHECK (day_of_week BETWEEN 1 AND 7), -- ISO-8601: 1=Monday .. 7=Sunday
    start_time     TIME    NOT NULL,
    end_time       TIME    NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT true
);
