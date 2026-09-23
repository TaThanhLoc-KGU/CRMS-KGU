import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Table, Select, Space, Tag, Typography, Input } from "antd";
import { listBookings, type BookingStatus, type BookingSummary } from "../../api/bookings";

const STATUS_OPTIONS: { label: string; value: BookingStatus }[] = [
  { label: "Đã tiếp nhận", value: "SUBMITTED" },
  { label: "Đang xem xét", value: "UNDER_REVIEW" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã lập phiếu", value: "SLIP_ISSUED" },
  { label: "Đang sử dụng", value: "IN_USE" },
  { label: "Đã trả phòng", value: "RETURNED" },
  { label: "Đã hoàn tất", value: "CLOSED" },
];

const STATUS_COLOR: Record<BookingStatus, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  SLIP_ISSUED: "green",
  IN_USE: "green",
  RETURNED: "default",
  CLOSED: "default",
};

export default function BookingsQueuePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const [unit, setUnit] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", status, unit],
    queryFn: () => listBookings({ status, unit: unit || undefined, size: 50 }),
  });

  return (
    <div>
      <Typography.Title level={4}>Hàng đợi duyệt đơn</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
        <Input.Search placeholder="Tìm theo đơn vị" allowClear onSearch={setUnit} style={{ width: 240 }} />
      </Space>

      <Table<BookingSummary>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.content ?? []}
        pagination={false}
        onRow={(record) => ({ onClick: () => navigate(`/admin/bookings/${record.id}`), style: { cursor: "pointer" } })}
        columns={[
          { title: "Mã đơn", dataIndex: "code", width: 160 },
          { title: "Đơn vị", dataIndex: "requesterUnit" },
          { title: "Người liên hệ", dataIndex: "contactName" },
          { title: "Phòng", dataIndex: "roomName" },
          {
            title: "Thời gian",
            render: (_, b) => (
              <span>
                {new Date(b.startTime).toLocaleString("vi-VN")} — {new Date(b.endTime).toLocaleTimeString("vi-VN")}
              </span>
            ),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            render: (s: BookingStatus) => <Tag color={STATUS_COLOR[s]}>{STATUS_OPTIONS.find((o) => o.value === s)?.label}</Tag>,
          },
        ]}
      />
    </div>
  );
}
