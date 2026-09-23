import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Button, Space, Modal, Form, Input, Table, Tag, message } from "antd";
import { FilePdfOutlined, PlusOutlined, LinkOutlined } from "@ant-design/icons";
import {
  createSlip,
  listSlipsByBooking,
  openSlipPdf,
  updateSlipItems,
  type HandoverItem,
  type HandoverType,
} from "../api/handover";
import { extractErrorMessage } from "../api/client";
import type { BookingStatus } from "../api/bookings";

const CONDITION_OPTIONS = ["Nguyên vẹn", "Hư hỏng", "Thiếu"];

interface HandoverSectionProps {
  bookingId: number;
  bookingStatus: BookingStatus;
  onChanged: () => void;
}

export default function HandoverSection({ bookingId, bookingStatus, onChanged }: HandoverSectionProps) {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<HandoverType | null>(null);
  const [form] = Form.useForm();
  const [editingItems, setEditingItems] = useState<Record<number, { conditionAfter?: string; note?: string }>>({});

  const { data: slips, isLoading } = useQuery({
    queryKey: ["handover-slips", bookingId],
    queryFn: () => listSlipsByBooking(bookingId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["handover-slips", bookingId] });
    onChanged();
  };

  const createMutation = useMutation({
    mutationFn: (values: { borrowerName: string; borrowerUnit?: string; borrowerPhone?: string; note?: string }) =>
      createSlip(bookingId, { type: modalType!, ...values }),
    onSuccess: (slip) => {
      message.success(`Đã lập ${slip.type === "BORROW" ? "phiếu mượn" : "phiếu trả"} ${slip.slipNo}`);
      setModalType(null);
      form.resetFields();
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const updateItemsMutation = useMutation({
    mutationFn: (slipId: number) =>
      updateSlipItems(
        slipId,
        Object.entries(editingItems).map(([itemId, values]) => ({ itemId: Number(itemId), ...values })),
      ),
    onSuccess: () => {
      message.success("Đã lưu tình trạng CSVC khi trả");
      setEditingItems({});
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const borrowSlip = slips?.find((s) => s.type === "BORROW");
  const returnSlip = slips?.find((s) => s.type === "RETURN");

  const canCreateBorrow = bookingStatus === "APPROVED" && !borrowSlip;
  const canCreateReturn = (bookingStatus === "SLIP_ISSUED" || bookingStatus === "IN_USE") && !returnSlip;

  if (isLoading) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Title level={5}>Phiếu mượn/trả</Typography.Title>

      <Space style={{ marginBottom: 12 }}>
        {canCreateBorrow && (
          <Button icon={<PlusOutlined />} onClick={() => setModalType("BORROW")}>
            Lập phiếu mượn
          </Button>
        )}
        {canCreateReturn && (
          <Button icon={<PlusOutlined />} onClick={() => setModalType("RETURN")}>
            Lập phiếu trả
          </Button>
        )}
      </Space>

      {slips?.map((slip) => (
        <div key={slip.id} style={{ background: "var(--paper-0)", border: "1px solid #f0f0f0", padding: 12, marginBottom: 12 }}>
          <Space style={{ marginBottom: 8 }}>
            <Tag color={slip.type === "BORROW" ? "blue" : "purple"}>
              {slip.type === "BORROW" ? "Phiếu mượn" : "Phiếu trả"}
            </Tag>
            <Typography.Text strong>{slip.slipNo}</Typography.Text>
            <Typography.Text type="secondary">
              Người mượn: {slip.borrowerName}
              {slip.borrowerUnit ? ` — ${slip.borrowerUnit}` : ""}
            </Typography.Text>
            <Button size="small" icon={<FilePdfOutlined />} onClick={() => openSlipPdf(slip.id)}>
              Xem/in PDF
            </Button>
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(slip.confirmUrl);
                message.success("Đã sao chép đường dẫn xác nhận (giống mã QR trên phiếu)");
              }}
            >
              Sao chép link xác nhận
            </Button>
            {slip.confirmedAt ? (
              <Tag color="green">Đã xác nhận lúc {new Date(slip.confirmedAt).toLocaleString("vi-VN")}</Tag>
            ) : (
              <Tag>Chưa quét QR xác nhận</Tag>
            )}
          </Space>

          <Table<HandoverItem>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={slip.items}
            columns={[
              { title: "Tên CSVC", dataIndex: "itemName" },
              { title: "SL", dataIndex: "quantity", width: 60 },
              { title: "Tình trạng trước", dataIndex: "conditionBefore", width: 130 },
              {
                title: slip.type === "RETURN" ? "Tình trạng khi trả" : "Tình trạng bàn giao",
                dataIndex: "conditionAfter",
                width: 180,
                render: (value: string | null, item: HandoverItem) =>
                  slip.type === "RETURN" && slip.status !== "COMPLETED" ? (
                    <Input
                      size="small"
                      placeholder={CONDITION_OPTIONS.join(" / ")}
                      defaultValue={value ?? ""}
                      onChange={(e) =>
                        setEditingItems((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], conditionAfter: e.target.value },
                        }))
                      }
                    />
                  ) : (
                    value ?? "-"
                  ),
              },
              {
                title: "Ghi chú",
                dataIndex: "note",
                render: (value: string | null, item: HandoverItem) =>
                  slip.type === "RETURN" && slip.status !== "COMPLETED" ? (
                    <Input
                      size="small"
                      defaultValue={value ?? ""}
                      onChange={(e) =>
                        setEditingItems((prev) => ({ ...prev, [item.id]: { ...prev[item.id], note: e.target.value } }))
                      }
                    />
                  ) : (
                    value ?? "-"
                  ),
              },
            ]}
          />

          {slip.type === "RETURN" && slip.status !== "COMPLETED" && (
            <Button
              type="primary"
              size="small"
              style={{ marginTop: 8 }}
              loading={updateItemsMutation.isPending}
              onClick={() => updateItemsMutation.mutate(slip.id)}
            >
              Lưu tình trạng khi trả
            </Button>
          )}
        </div>
      ))}

      <Modal
        title={modalType === "BORROW" ? "Lập phiếu mượn phòng" : "Lập phiếu trả phòng"}
        open={!!modalType}
        onCancel={() => setModalType(null)}
        onOk={() => form.validateFields().then((v) => createMutation.mutate(v))}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="borrowerName" label="Người mượn" rules={[{ required: true, message: "Bắt buộc" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="borrowerUnit" label="Đơn vị">
            <Input />
          </Form.Item>
          <Form.Item name="borrowerPhone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
