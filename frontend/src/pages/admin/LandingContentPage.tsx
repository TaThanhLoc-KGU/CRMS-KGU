import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Popconfirm, message, Image, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  createLandingSlide,
  deleteLandingSlide,
  listLandingSlides,
  updateLandingSlide,
  type LandingSlide,
  type LandingSlideRequest,
} from "../../api/landing";
import { extractErrorMessage } from "../../api/client";

export default function LandingContentPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LandingSlide | null>(null);
  const [form] = Form.useForm<LandingSlideRequest>();

  const { data: slides, isLoading } = useQuery({ queryKey: ["landing-slides"], queryFn: listLandingSlides });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["landing-slides"] });

  const saveMutation = useMutation({
    mutationFn: (values: LandingSlideRequest) =>
      editing ? updateLandingSlide(editing.id, values) : createLandingSlide(values),
    onSuccess: () => {
      message.success(editing ? "Đã cập nhật ảnh" : "Đã thêm ảnh");
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLandingSlide(id),
    onSuccess: () => {
      message.success("Đã xóa ảnh");
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sortOrder: (slides?.length ?? 0) * 10, active: true });
    setModalOpen(true);
  };

  const openEdit = (slide: LandingSlide) => {
    setEditing(slide);
    form.setFieldsValue({ ...slide, caption: slide.caption ?? undefined });
    setModalOpen(true);
  };

  return (
    <div>
      <Typography.Title level={4}>Nội dung trang chủ</Typography.Title>
      <Typography.Paragraph type="secondary">
        Ảnh carousel hiển thị đầu trang chủ công khai, theo đúng thứ tự bên dưới. Dòng chữ nhỏ, tiêu đề và đoạn mô
        tả phía dưới carousel chỉnh ở mục <b>Cấu hình → Trang chủ</b>.
      </Typography.Paragraph>

      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        Thêm ảnh
      </Button>

      <Table<LandingSlide>
        rowKey="id"
        loading={isLoading}
        dataSource={slides ?? []}
        pagination={false}
        columns={[
          {
            title: "Ảnh",
            dataIndex: "imageUrl",
            width: 140,
            render: (url: string) => <Image src={url} alt="" width={112} height={63} style={{ objectFit: "cover", borderRadius: 6 }} />,
          },
          { title: "Chú thích", dataIndex: "caption", render: (v: string | null) => v ?? "-" },
          { title: "Thứ tự", dataIndex: "sortOrder", width: 90 },
          {
            title: "Trạng thái",
            dataIndex: "active",
            width: 120,
            render: (active: boolean) => <Tag color={active ? "green" : "default"}>{active ? "Đang hiện" : "Đã ẩn"}</Tag>,
          },
          {
            title: "",
            key: "actions",
            width: 100,
            render: (_, slide) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(slide)} />
                <Popconfirm title="Xóa ảnh này?" onConfirm={() => deleteMutation.mutate(slide.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? "Sửa ảnh" : "Thêm ảnh"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.validateFields().then((v) => saveMutation.mutate(v))}
        confirmLoading={saveMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="imageUrl"
            label="URL ảnh"
            rules={[{ required: true, message: "Vui lòng nhập URL ảnh" }]}
            extra="Ảnh nên có tỷ lệ 16:9 để hiển thị đẹp trong carousel."
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="caption" label="Chú thích (không bắt buộc)">
            <Input />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự hiển thị" initialValue={0}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="active" label="Hiển thị trên trang chủ" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
