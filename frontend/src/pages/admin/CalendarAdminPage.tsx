import { useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import type { EventInput, DatesSetArg, EventClickArg, EventHoveringArg } from "@fullcalendar/core";
import { Select, Typography, Space, Segmented, Table, Tag, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listRooms } from "../../api/rooms";
import { getInternalCalendar, type CalendarEvent } from "../../api/bookings";

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "#faad14",
  UNDER_REVIEW: "#faad14",
  APPROVED: "#0f9d6e",
  SLIP_ISSUED: "#0f9d6e",
  IN_USE: "#1677ff",
  RETURNED: "#8c8c8c",
  CLOSED: "#8c8c8c",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Đã tiếp nhận",
  UNDER_REVIEW: "Đang xem xét",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  SLIP_ISSUED: "Đã lập phiếu",
  IN_USE: "Đang sử dụng",
  RETURNED: "Đã trả phòng",
  CLOSED: "Đã hoàn tất",
};

const timeRangeLabel = (e: CalendarEvent) =>
  `${new Date(e.start).toLocaleString("vi-VN")} — ${new Date(e.end).toLocaleTimeString("vi-VN")}`;

export default function CalendarAdminPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [hover, setHover] = useState<{ x: number; y: number; event: CalendarEvent } | null>(null);

  const { data: roomsPage } = useQuery({ queryKey: ["calendar-rooms-admin"], queryFn: () => listRooms({ size: 100 }) });

  const { data: events } = useQuery({
    queryKey: ["internal-calendar", roomId, range?.from, range?.to],
    queryFn: () => getInternalCalendar(range!.from, range!.to, roomId),
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
    color: STATUS_COLOR[e.status] ?? "#1677ff",
  }));

  const sortedEvents = useMemo(
    () => [...(events ?? [])].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events],
  );

  return (
    <div>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Lịch nội bộ
        </Typography.Title>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as "calendar" | "table")}
          options={[
            { label: "Lịch", value: "calendar" },
            { label: "Bảng", value: "table" },
          ]}
        />
      </Space>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Tất cả các phòng"
          style={{ width: 260 }}
          value={roomId}
          onChange={setRoomId}
          options={roomsPage?.content.map((r) => ({ value: r.id, label: r.name }))}
        />
      </Space>

      {viewMode === "calendar" ? (
        <div style={{ background: "var(--surface)", padding: 16, borderRadius: 8, position: "relative" }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            locale="vi"
            height="auto"
            events={calendarEvents}
            eventClick={(arg: EventClickArg) => navigate(`/admin/bookings/${arg.event.id}`)}
            eventMouseEnter={(arg: EventHoveringArg) => {
              const found = findEvent(arg.event.id);
              if (found) setHover({ x: arg.jsEvent.clientX, y: arg.jsEvent.clientY, event: found });
            }}
            eventMouseLeave={() => setHover(null)}
            datesSet={handleDatesSet}
          />
          {hover && (
            <div
              style={{
                position: "fixed",
                left: hover.x + 14,
                top: hover.y + 14,
                zIndex: 1000,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "var(--shadow-2)",
                padding: "10px 14px",
                pointerEvents: "none",
                maxWidth: 280,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{hover.event.roomName}</div>
              <div style={{ fontSize: 13, color: "var(--slate-500)", marginBottom: 4 }}>{hover.event.title}</div>
              <div style={{ fontSize: 13, color: "var(--slate-500)" }}>{timeRangeLabel(hover.event)}</div>
              <Tag color={STATUS_COLOR[hover.event.status]} style={{ marginTop: 6 }}>
                {STATUS_LABEL[hover.event.status] ?? hover.event.status}
              </Tag>
            </div>
          )}
        </div>
      ) : (
        <Table<CalendarEvent>
          rowKey="bookingId"
          dataSource={sortedEvents}
          pagination={false}
          onRow={(record) => ({ onClick: () => navigate(`/admin/bookings/${record.bookingId}`), style: { cursor: "pointer" } })}
          columns={[
            { title: "Đơn vị", dataIndex: "title" },
            { title: "Phòng", dataIndex: "roomName" },
            { title: "Thời gian", render: (_, e) => timeRangeLabel(e) },
            {
              title: "Trạng thái",
              render: (_, e) => <Tag color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status] ?? e.status}</Tag>,
            },
            {
              title: "",
              width: 90,
              render: (_, e) => (
                <Button size="small" onClick={() => navigate(`/admin/bookings/${e.bookingId}`)}>
                  Xem
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
