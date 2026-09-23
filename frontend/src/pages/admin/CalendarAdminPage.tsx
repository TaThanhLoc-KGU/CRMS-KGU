import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import type { EventInput, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { Select, Typography, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listRooms } from "../../api/rooms";
import { getInternalCalendar } from "../../api/bookings";

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "#faad14",
  UNDER_REVIEW: "#faad14",
  APPROVED: "#52c41a",
  SLIP_ISSUED: "#52c41a",
  IN_USE: "#1677ff",
  RETURNED: "#8c8c8c",
  CLOSED: "#8c8c8c",
};

export default function CalendarAdminPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const { data: roomsPage } = useQuery({ queryKey: ["calendar-rooms-admin"], queryFn: () => listRooms({ size: 100 }) });

  const { data: events } = useQuery({
    queryKey: ["internal-calendar", roomId, range?.from, range?.to],
    queryFn: () => getInternalCalendar(range!.from, range!.to, roomId),
    enabled: !!range,
  });

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start.toISOString(), to: arg.end.toISOString() });
  }, []);

  const calendarEvents: EventInput[] = (events ?? []).map((e) => ({
    id: String(e.bookingId),
    title: `${e.roomName} — ${e.title}`,
    start: e.start,
    end: e.end,
    color: STATUS_COLOR[e.status] ?? "#1677ff",
  }));

  const handleEventClick = (arg: EventClickArg) => {
    navigate(`/admin/bookings/${arg.event.id}`);
  };

  return (
    <div>
      <Typography.Title level={4}>Lịch nội bộ</Typography.Title>
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
      <div style={{ background: "var(--surface)", padding: 16, borderRadius: 8 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
          locale="vi"
          height="auto"
          events={calendarEvents}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
}
