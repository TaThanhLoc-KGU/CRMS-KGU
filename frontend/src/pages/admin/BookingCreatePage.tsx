import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Upload,
  Typography,
  Result,
  Alert,
  Table,
  Breadcrumb,
  List,
  Tag,
  Space,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs, { type Dayjs } from "dayjs";
import { listPublicRooms } from "../../api/rooms";
import { apiClient, extractErrorMessage } from "../../api/client";
import { createInternalBooking, type BookingSubmitResult, type BookingEquipmentItem } from "../../api/bookings";

interface SetupStyleOption {
  id: number;
  name: string;
}

interface EquipmentOption {
  id: number;
  name: string;
  unit?: string;
}

interface FormValues {
  roomId: number;
  setupStyleId?: number;
  requesterUnit: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  date: Dayjs;
  timeRange: [Dayjs, Dayjs];
  expectedAttendees?: number;
  purpose?: string;
  extraRequirements?: string;
  repeat?: boolean;
  repeatWeeks?: number;
}

/** Staff recording a booking directly — e.g. a phone or walk-in request — instead of
 * the requester using the public form. Deliberately the same fields as
 * BookingFormPage.tsx (public) minus the "đồng ý nội quy" checkbox, which doesn't
 * apply when staff themselves enter the booking; agreeToTerms is just hardcoded true
 * in the request. See BookingService#createInternal for why this still lands as
 * SUBMITTED rather than auto-approving. */
export default function BookingCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<number, number>>({});
  const [submitResult, setSubmitResult] = useState<BookingSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: roomsPage } = useQuery({ queryKey: ["booking-form-rooms"], queryFn: () => listPublicRooms({ size: 100 }) });
  const { data: setupStyles } = useQuery({
    queryKey: ["setup-styles"],
    queryFn: async () => (await apiClient.get<SetupStyleOption[]>("/public/setup-styles")).data,
  });
  const { data: equipments } = useQuery({
    queryKey: ["equipments-public"],
    queryFn: async () => (await apiClient.get<EquipmentOption[]>("/public/equipments")).data,
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const [startTimeOfDay, endTimeOfDay] = values.timeRange;
      const start = values.date.hour(startTimeOfDay.hour()).minute(startTimeOfDay.minute()).second(0);
      const end = values.date.hour(endTimeOfDay.hour()).minute(endTimeOfDay.minute()).second(0);

      const equipmentItems: BookingEquipmentItem[] = Object.entries(equipmentQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([equipmentId, qty]) => ({ equipmentId: Number(equipmentId), quantity: qty }));

      return createInternalBooking(
        {
          roomId: values.roomId,
          setupStyleId: values.setupStyleId,
          requesterUnit: values.requesterUnit,
          contactName: values.contactName,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          expectedAttendees: values.expectedAttendees,
          purpose: values.purpose,
          extraRequirements: values.extraRequirements,
          equipmentItems,
          agreeToTerms: true,
          repeatWeeks: values.repeat ? values.repeatWeeks : undefined,
        },
        fileList.map((f) => f.originFileObj as File).filter(Boolean),
      );
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setErrorMessage(null);
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  if (submitResult) {
    if (submitResult.recurring) {
      const occurrences = submitResult.occurrences ?? [];
      const created = occurrences.filter((o) => o.outcome === "CREATED");
      return (
        <div style={{ maxWidth: 700 }}>
          <Result
            status={created.length > 0 ? "success" : "warning"}
            title="Đã xử lý đơn định kỳ"
            subTitle={`${created.length}/${occurrences.length} lần lặp được tạo đơn thành công. Mỗi đơn vẫn cần duyệt riêng.`}
            extra={[
              <Button type="primary" key="list" onClick={() => navigate("/admin/bookings")}>
                Về hàng đợi duyệt đơn
              </Button>,
            ]}
          />
          <List
            bordered
            dataSource={occurrences}
            renderItem={(o) => (
              <List.Item>
                <Space direction="vertical" size={0} style={{ width: "100%" }}>
                  <Space>
                    <span>
                      {new Date(o.startTime).toLocaleString("vi-VN")} - {new Date(o.endTime).toLocaleTimeString("vi-VN")}
                    </span>
                    {o.outcome === "CREATED" && (
                      <Tag
                        color="green"
                        style={{ cursor: "pointer" }}
                        onClick={() => o.booking && navigate(`/admin/bookings/${o.booking.id}`)}
                      >
                        Đã tạo đơn {o.booking?.code} — xem
                      </Tag>
                    )}
                    {o.outcome === "WAITLISTED" && <Tag color="gold">Vào danh sách chờ</Tag>}
                    {o.outcome === "REJECTED" && <Tag color="red">Không thể đặt</Tag>}
                  </Space>
                  {o.reason && <Typography.Text type="secondary">{o.reason}</Typography.Text>}
                </Space>
              </List.Item>
            )}
          />
        </div>
      );
    }

    if (submitResult.waitlisted) {
      return (
        <Result
          status="info"
          title="Phòng đang bận — đã thêm vào danh sách chờ"
          subTitle="Khung giờ đã chọn hiện đã có đơn khác được duyệt. Yêu cầu đã được ghi nhận vào danh sách chờ, hệ thống sẽ tự gửi email khi khung giờ này trống trở lại."
          extra={[
            <Button type="primary" key="waitlist" onClick={() => navigate("/admin/waitlist")}>
              Xem danh sách chờ
            </Button>,
            <Button key="new" onClick={() => setSubmitResult(null)}>
              Tạo đơn khác
            </Button>,
          ]}
        />
      );
    }

    const booking = submitResult.booking!;
    return (
      <Result
        status="success"
        title="Đã tạo đơn"
        subTitle={
          <>
            Mã đơn <b>{booking.code}</b> đã được tạo, trạng thái "Đã tiếp nhận" — vẫn cần duyệt như một đơn bình
            thường. Hệ thống đã gửi email xác nhận tới <b>{booking.contactEmail}</b>.
          </>
        }
        extra={[
          <Button type="primary" key="detail" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
            Xem chi tiết đơn
          </Button>,
          <Button key="new" onClick={() => setSubmitResult(null)}>
            Tạo đơn khác
          </Button>,
        ]}
      />
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: <a onClick={() => navigate("/admin/bookings")}>Duyệt đơn</a> }, { title: "Tạo đơn mới" }]}
      />
      <Typography.Title level={4}>Tạo đơn mượn phòng (thủ công)</Typography.Title>
      <Typography.Paragraph type="secondary">
        Dùng khi một đơn vị gọi điện hoặc đến trực tiếp yêu cầu mượn phòng thay vì tự đăng ký qua cổng công khai. Đơn
        tạo ở đây vẫn ở trạng thái "Đã tiếp nhận" và cần được duyệt như bình thường.
      </Typography.Paragraph>

      {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} closable />}

      <Form<FormValues> form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)} disabled={mutation.isPending}>
        <Form.Item name="roomId" label="Phòng" rules={[{ required: true, message: "Vui lòng chọn phòng" }]}>
          <Select
            showSearch
            placeholder="Chọn phòng"
            optionFilterProp="label"
            options={roomsPage?.content.map((r) => ({ value: r.id, label: `${r.code} — ${r.name} (${r.capacity ?? "?"} người)` }))}
          />
        </Form.Item>

        <Form.Item name="setupStyleId" label="Kiểu bố trí">
          <Select
            allowClear
            placeholder="Chọn kiểu bố trí (nếu có yêu cầu)"
            options={setupStyles?.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>

        <Form.Item name="requesterUnit" label="Đơn vị đăng ký" rules={[{ required: true, message: "Vui lòng nhập tên đơn vị" }]}>
          <Input placeholder="VD: Khoa Công nghệ Thông tin" />
        </Form.Item>

        <Form.Item name="contactName" label="Người liên hệ" rules={[{ required: true, message: "Vui lòng nhập tên người liên hệ" }]}>
          <Input />
        </Form.Item>

        <Form.Item
          name="contactEmail"
          label="Email liên hệ"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="dùng để gửi email xác nhận/kết quả duyệt" />
        </Form.Item>

        <Form.Item name="contactPhone" label="Số điện thoại">
          <Input />
        </Form.Item>

        <Form.Item name="date" label="Ngày sử dụng" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabledDate={(d) => d.isBefore(dayjs(), "day")} />
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="Giờ bắt đầu — kết thúc"
          rules={[{ required: true, message: "Vui lòng chọn khung giờ" }]}
        >
          <DatePicker.RangePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="repeat" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Checkbox>Lặp lại hàng tuần (VD: sinh hoạt CLB, họp giao ban định kỳ)</Checkbox>
        </Form.Item>

        <Form.Item shouldUpdate={(prev, cur) => prev.repeat !== cur.repeat} style={{ marginBottom: 24 }} noStyle>
          {({ getFieldValue }) =>
            getFieldValue("repeat") && (
              <Form.Item
                name="repeatWeeks"
                label="Số tuần lặp lại (kể cả tuần đầu)"
                initialValue={4}
                rules={[{ required: true, message: "Vui lòng nhập số tuần" }]}
              >
                <InputNumber min={2} max={12} style={{ width: "100%" }} />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item name="expectedAttendees" label="Số người dự kiến">
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="purpose" label="Mục đích sử dụng">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="extraRequirements" label="Yêu cầu khác">
          <Input.TextArea rows={2} />
        </Form.Item>

        {equipments && equipments.length > 0 && (
          <Form.Item label="Thiết bị mượn thêm">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={equipments}
              columns={[
                { title: "Thiết bị", dataIndex: "name" },
                { title: "Đơn vị tính", dataIndex: "unit", width: 100 },
                {
                  title: "Số lượng",
                  width: 140,
                  render: (_, item: EquipmentOption) => (
                    <InputNumber
                      min={0}
                      value={equipmentQuantities[item.id] ?? 0}
                      onChange={(value) => setEquipmentQuantities((prev) => ({ ...prev, [item.id]: value ?? 0 }))}
                    />
                  ),
                },
              ]}
            />
          </Form.Item>
        )}

        <Form.Item label="Văn bản đính kèm">
          <Upload.Dragger
            multiple
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Kéo thả hoặc bấm để chọn văn bản (PDF, DOC, DOCX, JPG, PNG)</p>
          </Upload.Dragger>
        </Form.Item>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Đơn tạo thủ công vẫn áp dụng đúng quy tắc thời gian đăng ký tối thiểu, giờ làm việc và chống trùng lịch như đơn công khai — hệ thống sẽ báo lỗi nếu vi phạm."
        />

        <Button type="primary" htmlType="submit" size="large" loading={mutation.isPending} block>
          Tạo đơn
        </Button>
      </Form>
    </div>
  );
}
