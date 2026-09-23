import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import type { EventInput, DatesSetArg } from "@fullcalendar/core";
import { Select, Typography, Tag, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { listPublicRooms } from "../../api/rooms";
import { getPublicCalendar } from "../../api/bookings";

export default function CalendarPublicPage() {
  const [roomId, setRoomId] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const { data: roomsPage } = useQuery({ queryKey: ["calendar-rooms"], queryFn: () => listPublicRooms({ size: 100 }) });

  const { data: events } = useQuery({
    queryKey: ["public-calendar", roomId, range?.from, range?.to],
    queryFn: () => getPublicCalendar(range!.from, range!.to, roomId),
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
    color: e.status === "APPROVED" || e.status === "SLIP_ISSUED" || e.status === "IN_USE" ? "#52c41a" : "#faad14",
  }));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <Typography.Title level={3}>Lịch phòng công khai</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
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

      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
          locale="vi"
          height="auto"
          events={calendarEvents}
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
}
