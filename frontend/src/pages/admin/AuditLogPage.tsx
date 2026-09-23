import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography, Table, Input, Space } from "antd";
import { listAuditLogs, type AuditLogEntry } from "../../api/audit";

export default function AuditLogPage() {
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", entity, action],
    queryFn: () => listAuditLogs({ entity: entity || undefined, action: action || undefined, size: 50 }),
  });

  return (
    <div>
      <Typography.Title level={4}>Nhật ký kiểm toán</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="Lọc theo entity (VD: Booking)" allowClear onChange={(e) => setEntity(e.target.value)} style={{ width: 220 }} />
        <Input placeholder="Lọc theo action (VD: BOOKING_APPROVE_LEVEL_1)" allowClear onChange={(e) => setAction(e.target.value)} style={{ width: 280 }} />
      </Space>
      <Table<AuditLogEntry>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.content ?? []}
        pagination={false}
        columns={[
          {
            title: "Thời gian",
            dataIndex: "createdAt",
            width: 170,
            render: (v: string) => new Date(v).toLocaleString("vi-VN"),
          },
          { title: "Hành động", dataIndex: "action", width: 220 },
          { title: "Đối tượng", dataIndex: "entity", width: 120 },
          { title: "ID", dataIndex: "entityId", width: 80 },
          { title: "Chi tiết", dataIndex: "detail" },
          { title: "IP", dataIndex: "ip", width: 130 },
        ]}
      />
    </div>
  );
}
