import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Typography,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Modal,
  Input,
  message,
  Breadcrumb,
  Alert,
  Table,
} from "antd";
import { CheckCircleFilled, CheckOutlined, CloseCircleFilled, CloseOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import {
  approveBooking,
  cancelBooking,
  closeBooking,
  downloadAttachment,
  getAttachmentPreviewUrl,
  getBooking,
  rejectBooking,
  suggestRooms,
  type BookingAttachment,
  type BookingStatus,
} from "../../api/bookings";
import { extractErrorMessage, API_ORIGIN } from "../../api/client";
import HandoverSection from "../../components/HandoverSection";

const STATUS_LABEL: Record<BookingStatus, { text: string; color: string }> = {
  SUBMITTED: { text: "Đã tiếp nhận", color: "blue" },
  UNDER_REVIEW: { text: "Đang xem xét", color: "blue" },
  APPROVED: { text: "Đã duyệt", color: "green" },
  REJECTED: { text: "Đã từ chối", color: "red" },
  CANCELLED: { text: "Đã hủy", color: "default" },
  SLIP_ISSUED: { text: "Đã lập phiếu", color: "green" },
  IN_USE: { text: "Đang sử dụng", color: "green" },
  RETURNED: { text: "Đã trả phòng", color: "default" },
  CLOSED: { text: "Đã hoàn tất", color: "default" },
};

const DECIDABLE: BookingStatus[] = ["SUBMITTED", "UNDER_REVIEW"];
const CANCELLABLE: BookingStatus[] = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"];
const APPROVED_LINEAGE: BookingStatus[] = ["APPROVED", "SLIP_ISSUED", "IN_USE", "RETURNED", "CLOSED"];

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [justStamped, setJustStamped] = useState<"APPROVED" | "REJECTED" | null>(null);

  const { data: booking, isLoading } = useQuery({ queryKey: ["booking", id], queryFn: () => getBooking(id) });
  const {
    data: suggestions,
    refetch: fetchSuggestions,
    isFetching: isFetchingSuggestions,
  } = useQuery({
    queryKey: ["booking-suggestions", id],
    queryFn: () => suggestRooms(id),
    enabled: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["booking", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveBooking(id),
    onSuccess: (updated) => {
      message.success("Đã duyệt đơn");
      if (updated.status === "APPROVED") {
        setJustStamped("APPROVED");
      }
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectBooking(id, reason),
    onSuccess: () => {
      message.success("Đã từ chối đơn");
      setRejectModalOpen(false);
      setRejectReason("");
      setJustStamped("REJECTED");
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelBooking(id, reason),
    onSuccess: () => {
      message.success("Đã hủy đơn");
      setCancelModalOpen(false);
      setCancelReason("");
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeBooking(id),
    onSuccess: () => {
      message.success("Đã nghiệm thu, hoàn tất đơn");
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const openPreview = async (attachment: BookingAttachment) => {
    try {
      const url = await getAttachmentPreviewUrl(id, attachment.id);
      setPreviewUrl(`${API_ORIGIN}${url}`);
      setPreviewName(attachment.fileName);
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  if (isLoading || !booking) {
    return <div>Đang tải...</div>;
  }

  const status = STATUS_LABEL[booking.status];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate("/admin/bookings")}>Duyệt đơn</a> },
          { title: booking.code },
        ]}
      />

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {booking.code}
            </Typography.Title>
            <Tag color={status.color}>{status.text}</Tag>
            {(APPROVED_LINEAGE.includes(booking.status) || booking.status === "REJECTED") && (
              <span
                className={`crms-chip ${booking.status === "REJECTED" ? "crms-chip--danger" : "crms-chip--success"} ${
                  justStamped ? "crms-chip-enter" : ""
                }`}
              >
                {booking.status === "REJECTED" ? <CloseCircleFilled /> : <CheckCircleFilled />}
                {booking.status === "REJECTED" ? "Đã từ chối" : "Đã duyệt"}
              </span>
            )}
          </div>

          <Descriptions bordered column={2} size="small" style={{ background: "var(--surface)", marginBottom: 16 }}>
            <Descriptions.Item label="Đơn vị">{booking.requesterUnit}</Descriptions.Item>
            <Descriptions.Item label="Người liên hệ">{booking.contactName}</Descriptions.Item>
            <Descriptions.Item label="Email">{booking.contactEmail}</Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{booking.contactPhone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Phòng">{booking.roomCode} — {booking.roomName}</Descriptions.Item>
            <Descriptions.Item label="Kiểu bố trí">{booking.setupStyleName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Thời gian" span={2}>
              {new Date(booking.startTime).toLocaleString("vi-VN")} — {new Date(booking.endTime).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Số người dự kiến">{booking.expectedAttendees ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Nguồn">{booking.source === "PUBLIC" ? "Công khai" : "Nội bộ"}</Descriptions.Item>
            <Descriptions.Item label="Mục đích" span={2}>{booking.purpose ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Yêu cầu khác" span={2}>{booking.extraRequirements ?? "-"}</Descriptions.Item>
            {booking.cancelReason && (
              <Descriptions.Item label="Lý do hủy/từ chối" span={2}>{booking.cancelReason}</Descriptions.Item>
            )}
          </Descriptions>

          {booking.equipments.length > 0 && (
            <>
              <Typography.Title level={5}>Thiết bị yêu cầu thêm</Typography.Title>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={booking.equipments}
                style={{ marginBottom: 16 }}
                columns={[
                  { title: "Thiết bị", dataIndex: "equipmentName" },
                  { title: "Số lượng", dataIndex: "quantity", width: 100 },
                  { title: "Ghi chú", dataIndex: "note" },
                ]}
              />
            </>
          )}

          <Typography.Title level={5}>Văn bản đính kèm</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={booking.attachments}
            locale={{ emptyText: "Không có văn bản đính kèm" }}
            style={{ marginBottom: 16, background: "var(--surface)" }}
            renderItem={(attachment) => (
              <List.Item
                actions={[
                  <Button key="preview" size="small" icon={<EyeOutlined />} onClick={() => openPreview(attachment)}>
                    Xem
                  </Button>,
                  <Button
                    key="download"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadAttachment(id, attachment.id, attachment.fileName)}
                  >
                    Tải về
                  </Button>,
                ]}
              >
                {attachment.fileName} ({Math.round(attachment.sizeBytes / 1024)} KB)
              </List.Item>
            )}
          />

          <HandoverSection bookingId={id} bookingStatus={booking.status} onChanged={invalidate} />

          {booking.approvals.length > 0 && (
            <>
              <Typography.Title level={5}>Lịch sử duyệt</Typography.Title>
              <List
                size="small"
                bordered
                dataSource={booking.approvals}
                style={{ background: "var(--surface)", marginBottom: 16 }}
                renderItem={(a) => (
                  <List.Item>
                    <Tag color={a.decision === "APPROVED" ? "green" : "red"}>
                      {a.decision === "APPROVED" ? "Duyệt" : "Từ chối"}
                    </Tag>{" "}
                    bởi {a.approverName} lúc {new Date(a.decidedAt).toLocaleString("vi-VN")}
                    {a.comment && ` — ${a.comment}`}
                  </List.Item>
                )}
              />
            </>
          )}
        </div>

        <div style={{ width: 420, flexShrink: 0 }}>
          <Typography.Title level={5}>Thao tác</Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            {DECIDABLE.includes(booking.status) && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  block
                  loading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                >
                  Duyệt đơn
                </Button>
                <Button danger icon={<CloseOutlined />} block onClick={() => setRejectModalOpen(true)}>
                  Từ chối
                </Button>
              </>
            )}
            {CANCELLABLE.includes(booking.status) && (
              <Button block onClick={() => setCancelModalOpen(true)}>
                Hủy đơn
              </Button>
            )}
            {booking.status === "RETURNED" && (
              <Button type="primary" block loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
                Nghiệm thu, hoàn tất đơn
              </Button>
            )}
            <Button block loading={isFetchingSuggestions} onClick={() => fetchSuggestions()}>
              Gợi ý phòng thay thế
            </Button>
            {approveMutation.isError && (
              <Alert type="error" showIcon message={extractErrorMessage(approveMutation.error)} />
            )}
          </Space>

          {previewUrl && (
            <div style={{ marginTop: 24 }}>
              <Typography.Text strong>Xem trước: {previewName}</Typography.Text>
              <iframe
                title="preview"
                src={previewUrl}
                style={{ width: "100%", height: 480, border: "1px solid #eee", marginTop: 8 }}
              />
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Typography.Title level={5}>Phòng thay thế phù hợp</Typography.Title>
              <List
                size="small"
                bordered
                dataSource={suggestions}
                renderItem={(r) => (
                  <List.Item>
                    {r.code} — {r.name} (sức chứa {r.capacity})
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Từ chối đơn"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => rejectMutation.mutate(rejectReason)}
        confirmLoading={rejectMutation.isPending}
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
      >
        <Input.TextArea
          rows={3}
          placeholder="Nhập lý do từ chối"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="Hủy đơn"
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        onOk={() => cancelMutation.mutate(cancelReason)}
        confirmLoading={cancelMutation.isPending}
        okButtonProps={{ disabled: !cancelReason.trim() }}
      >
        <Input.TextArea
          rows={3}
          placeholder="Nhập lý do hủy"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
