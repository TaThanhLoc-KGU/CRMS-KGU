import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Table, Select, Space, Tag, Button, Popconfirm, message } from "antd";
import { cancelWaitlistEntry, listWaitlist, type WaitlistEntry, type WaitlistStatus } from "../../api/waitlist";
import { extractErrorMessage } from "../../api/client";

const STATUS_LABEL: Record<WaitlistStatus, { text: string; color: string }> = {
  WAITING: { text: "Đang chờ", color: "gold" },
  NOTIFIED: { text: "Đã báo trống", color: "blue" },
  CANCELLED: { text: "Đã hủy", color: "default" },
};

export default function WaitlistPage() {
  const [status, setStatus] = useState<WaitlistStatus | undefined>("WAITING");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["waitlist", status],
    queryFn: () => listWaitlist({ status }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelWaitlistEntry(id),
    onSuccess: () => {
      message.success("Đã hủy mục chờ");
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  return (
    <div>
      <Typography.Title level={4}>Danh sách chờ (phòng bận)</Typography.Title>
      <Typography.Paragraph type="secondary">
        Khi cấu hình "Xử lý khi trùng lịch" là WAITLIST, đơn đăng ký công khai trùng giờ với một đơn đã duyệt sẽ vào
        đây thay vì tạo một đơn cạnh tranh khác. Hệ thống tự gửi email khi đơn đang chiếm chỗ bị hủy.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Select<WaitlistStatus | undefined>
          value={status}
          style={{ width: 200 }}
          allowClear
          placeholder="Tất cả trạng thái"
          onChange={setStatus}
          options={[
            { value: "WAITING", label: "Đang chờ" },
            { value: "NOTIFIED", label: "Đã báo trống" },
            { value: "CANCELLED", label: "Đã hủy" },
          ]}
        />
      </Space>
      <Table<WaitlistEntry>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        columns={[
          { title: "Phòng", render: (_, e) => `${e.roomCode} — ${e.roomName}` },
          {
            title: "Thời gian mong muốn",
            render: (_, e) => `${new Date(e.startTime).toLocaleString("vi-VN")} - ${new Date(e.endTime).toLocaleTimeString("vi-VN")}`,
          },
          { title: "Đơn vị", dataIndex: "requesterUnit" },
          { title: "Người liên hệ", render: (_, e) => `${e.contactName} (${e.contactEmail})` },
          {
            title: "Trạng thái",
            dataIndex: "status",
            render: (s: WaitlistStatus) => <Tag color={STATUS_LABEL[s].color}>{STATUS_LABEL[s].text}</Tag>,
          },
          { title: "Tạo lúc", dataIndex: "createdAt", render: (v: string) => new Date(v).toLocaleString("vi-VN") },
          {
            title: "",
            width: 100,
            render: (_, e) =>
              e.status === "WAITING" && (
                <Popconfirm title="Hủy mục chờ này?" onConfirm={() => cancelMutation.mutate(e.id)}>
                  <Button size="small" danger>
                    Hủy
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
    </div>
  );
}
