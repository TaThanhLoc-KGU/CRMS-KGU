import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Form, Input, Button, Typography, Descriptions, Tag, Alert } from "antd";
import { lookupBooking, type BookingPublicStatus, type BookingStatus } from "../../api/bookings";
import { extractErrorMessage } from "../../api/client";

const STATUS_LABEL: Record<BookingStatus, { text: string; color: string }> = {
  SUBMITTED: { text: "Đã tiếp nhận, chờ xử lý", color: "blue" },
  UNDER_REVIEW: { text: "Đang xem xét", color: "blue" },
  APPROVED: { text: "Đã duyệt", color: "green" },
  REJECTED: { text: "Đã từ chối", color: "red" },
  CANCELLED: { text: "Đã hủy", color: "default" },
  SLIP_ISSUED: { text: "Đã lập phiếu mượn", color: "green" },
  IN_USE: { text: "Đang sử dụng", color: "green" },
  RETURNED: { text: "Đã trả phòng", color: "default" },
  CLOSED: { text: "Đã hoàn tất", color: "default" },
};

export default function BookingLookupPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<BookingPublicStatus | null>(null);

  const mutation = useMutation({
    mutationFn: ({ code, email }: { code: string; email: string }) => lookupBooking(code, email),
    onSuccess: setResult,
  });

  return (
    <div style={{ maxWidth: 560, margin: "48px auto", padding: 24 }}>
      <Typography.Title level={3}>Tra cứu đơn mượn phòng</Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập mã đơn (VD: CRMS-2026-000123) và email đã đăng ký để xem trạng thái xử lý.
      </Typography.Paragraph>

      <Form
        layout="vertical"
        initialValues={{ code: searchParams.get("code") ?? "" }}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item name="code" label="Mã đơn" rules={[{ required: true, message: "Vui lòng nhập mã đơn" }]}>
          <Input placeholder="CRMS-2026-000123" />
        </Form.Item>
        <Form.Item name="email" label="Email đã đăng ký" rules={[{ required: true, message: "Vui lòng nhập email" }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
          Tra cứu
        </Button>
      </Form>

      {mutation.isError && (
        <Alert
          style={{ marginTop: 24 }}
          type="error"
          showIcon
          message={extractErrorMessage(mutation.error)}
        />
      )}

      {result && (
        <Descriptions bordered column={1} style={{ marginTop: 24, background: "var(--surface)" }}>
          <Descriptions.Item label="Mã đơn">{result.code}</Descriptions.Item>
          <Descriptions.Item label="Phòng">{result.roomName}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {new Date(result.startTime).toLocaleString("vi-VN")} — {new Date(result.endTime).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={STATUS_LABEL[result.status].color}>{STATUS_LABEL[result.status].text}</Tag>
          </Descriptions.Item>
          {result.cancelReason && <Descriptions.Item label="Lý do">{result.cancelReason}</Descriptions.Item>}
        </Descriptions>
      )}
    </div>
  );
}
