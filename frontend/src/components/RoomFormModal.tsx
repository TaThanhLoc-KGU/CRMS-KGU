import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";
import type { Room, RoomRequest, RoomStatus } from "../api/rooms";

const STATUS_OPTIONS: { label: string; value: RoomStatus }[] = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Bảo trì", value: "MAINTENANCE" },
  { label: "Ngừng sử dụng", value: "DISABLED" },
];

interface RoomFormModalProps {
  open: boolean;
  room: Room | null;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: RoomRequest) => void;
}

export default function RoomFormModal({
  open,
  room,
  confirmLoading,
  onCancel,
  onSubmit,
}: RoomFormModalProps) {
  const [form] = Form.useForm<RoomRequest>();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (room) {
        form.setFieldsValue({
          code: room.code,
          name: room.name,
          building: room.building ?? undefined,
          floor: room.floor ?? undefined,
          capacity: room.capacity ?? undefined,
          areaM2: room.areaM2 ?? undefined,
          description: room.description ?? undefined,
          thumbnailUrl: room.thumbnailUrl ?? undefined,
          status: room.status,
          minLeadHoursOverride: room.minLeadHoursOverride ?? undefined,
        });
      } else {
        form.setFieldsValue({ status: "ACTIVE" });
      }
    }
  }, [open, room, form]);

  return (
    <Modal
      title={room ? "Sửa phòng" : "Thêm phòng"}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      onOk={() => form.validateFields().then(onSubmit)}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="code"
          label="Mã phòng"
          rules={[{ required: true, message: "Vui lòng nhập mã phòng" }]}
        >
          <Input placeholder="VD: TT-TAM" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên phòng"
          rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="building" label="Tòa nhà">
          <Input />
        </Form.Item>
        <Form.Item name="floor" label="Tầng">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="capacity" label="Sức chứa">
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item name="areaM2" label="Diện tích (m²)">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="thumbnailUrl" label="URL ảnh đại diện">
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="minLeadHoursOverride" label="Số giờ đăng ký tối thiểu (ghi đè)">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
