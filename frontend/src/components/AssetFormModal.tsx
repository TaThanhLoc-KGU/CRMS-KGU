import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch } from "antd";
import { ASSET_CONDITIONS, type Asset, type AssetRequest } from "../api/assets";

interface AssetFormModalProps {
  open: boolean;
  asset: Asset | null;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: AssetRequest) => void;
}

export default function AssetFormModal({
  open,
  asset,
  confirmLoading,
  onCancel,
  onSubmit,
}: AssetFormModalProps) {
  const [form] = Form.useForm<AssetRequest>();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (asset) {
        form.setFieldsValue({
          assetCode: asset.assetCode,
          name: asset.name,
          category: asset.category ?? undefined,
          quantity: asset.quantity,
          unit: asset.unit ?? undefined,
          condition: asset.condition,
          purchaseYear: asset.purchaseYear ?? undefined,
          movable: asset.movable,
          note: asset.note ?? undefined,
        });
      } else {
        form.setFieldsValue({ quantity: 1, condition: "GOOD", movable: false });
      }
    }
  }, [open, asset, form]);

  return (
    <Modal
      title={asset ? "Sửa tài sản" : "Thêm tài sản"}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      onOk={() => form.validateFields().then(onSubmit)}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="assetCode"
          label="Mã tài sản"
          rules={[{ required: true, message: "Vui lòng nhập mã tài sản" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên tài sản"
          rules={[{ required: true, message: "Vui lòng nhập tên tài sản" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="category" label="Danh mục">
          <Input />
        </Form.Item>
        <Form.Item name="quantity" label="Số lượng">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item name="unit" label="Đơn vị tính">
          <Input placeholder="cái, bộ, chiếc..." />
        </Form.Item>
        <Form.Item name="condition" label="Tình trạng">
          <Select options={ASSET_CONDITIONS} />
        </Form.Item>
        <Form.Item name="purchaseYear" label="Năm mua">
          <InputNumber style={{ width: "100%" }} min={1990} max={2100} />
        </Form.Item>
        <Form.Item name="movable" label="Di động / dùng chung" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
