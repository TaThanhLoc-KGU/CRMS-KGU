import { useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import type { EventInput, DatesSetArg, EventClickArg, EventHoveringArg } from "@fullcalendar/core";
import { Select, Typography, Tag, Space, Segmented, Table, Modal } from "antd";
import { useQuery } from "@tanstack/react-query";
import { listPublicRooms } from "../../api/rooms";
import { getPublicCalendar, type CalendarEvent } from "../../api/bookings";

const APPROVED_LIKE = new Set(["APPROVED", "SLIP_ISSUED", "IN_USE"]);
const statusColor = (status: string) => (APPROVED_LIKE.has(status) ? "green" : "orange");
const timeRangeLabel = (e: CalendarEvent) =>
  `${new Date(e.start).toLocaleString("vi-VN")} — ${new Date(e.end).toLocaleTimeString("vi-VN")}`;

export default function CalendarPublicPage() {
  const [roomId, setRoomId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [hover, setHover] = useState<{ x: number; y: number; event: CalendarEvent } | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);

  const { data: roomsPage } = useQuery({ queryKey: ["calendar-rooms"], queryFn: () => listPublicRooms({ size: 100 }) });

  const { data: events } = useQuery({
    queryKey: ["public-calendar", roomId, range?.from, range?.to],
    queryFn: () => getPublicCalendar(range!.from, range!.to, roomId),
    enabled: !!range,
  });

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start.toISOString(), to: arg.end.toISOString() });
  }, []);

  const findEvent = (id: string) => events?.find((e) => String(e.bookingId) === id);

  const calendarEvents: EventInput[] = (events ?? []).map((e) => ({
    id: String(e.bookingId),
    title: `${e.roomName} — ${e.title}`,
    start: e.start,
    end: e.end,
    color: APPROVED_LIKE.has(e.status) ? "#0f9d6e" : "#b7791f",
  }));

  const sortedEvents = useMemo(
    () => [...(events ?? [])].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events],
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <Typography.Title level={3}>Lịch phòng công khai</Typography.Title>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
        <Space wrap>
          <Select
            allowClear
            placeholder="Tất cả các phòng"
            style={{ width: 260 }}
            value={roomId}
            onChange={setRoomId}
            options={roomsPage?.content.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Tag color="green">Đã duyệt</Tag>
          <Tag color="orange">Chờ duyệt</Tag>
        </Space>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as "calendar" | "table")}
          options={[
            { label: "Lịch", value: "calendar" },
            { label: "Bảng", value: "table" },
          ]}
        />
      </Space>

      {viewMode === "calendar" ? (
        <div className="crms-glass" style={{ padding: 16, position: "relative" }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            locale="vi"
            height="auto"
            events={calendarEvents}
            datesSet={handleDatesSet}
            eventMouseEnter={(arg: EventHoveringArg) => {
              const found = findEvent(arg.event.id);
              if (found) setHover({ x: arg.jsEvent.clientX, y: arg.jsEvent.clientY, event: found });
            }}
            eventMouseLeave={() => setHover(null)}
            eventClick={(arg: EventClickArg) => {
              const found = findEvent(arg.event.id);
              if (found) setDetail(found);
            }}
          />
          {hover && (
            <div
              className="crms-glass"
              style={{
                position: "fixed",
                left: hover.x + 14,
                top: hover.y + 14,
                zIndex: 1000,
                padding: "10px 14px",
                pointerEvents: "none",
                maxWidth: 260,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{hover.event.roomName}</div>
              <div style={{ fontSize: 13, color: "var(--slate-500)" }}>{timeRangeLabel(hover.event)}</div>
              <Tag color={statusColor(hover.event.status)} style={{ marginTop: 6 }}>
                {hover.event.title}
              </Tag>
            </div>
          )}
        </div>
      ) : (
        <Table<CalendarEvent>
          rowKey="bookingId"
          dataSource={sortedEvents}
          pagination={false}
          onRow={(record) => ({ onClick: () => setDetail(record), style: { cursor: "pointer" } })}
          columns={[
            { title: "Phòng", dataIndex: "roomName" },
            { title: "Thời gian", render: (_, e) => timeRangeLabel(e) },
            { title: "Trạng thái", render: (_, e) => <Tag color={statusColor(e.status)}>{e.title}</Tag> },
          ]}
        />
      )}

      <Modal open={!!detail} onCancel={() => setDetail(null)} footer={null} title="Chi tiết lịch">
        {detail && (
          <Space direction="vertical" size="middle">
            <div>
              <Typography.Text type="secondary">Phòng</Typography.Text>
              <div style={{ fontWeight: 600 }}>{detail.roomName}</div>
            </div>
            <div>
              <Typography.Text type="secondary">Thời gian</Typography.Text>
              <div>{timeRangeLabel(detail)}</div>
            </div>
            <div>
              <Typography.Text type="secondary">Trạng thái</Typography.Text>
              <div>
                <Tag color={statusColor(detail.status)}>{detail.title}</Tag>
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
