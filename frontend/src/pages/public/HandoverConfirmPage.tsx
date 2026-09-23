import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Result, Spin, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { confirmHandover, getHandoverConfirmInfo } from "../../api/handover";
import { extractErrorMessage } from "../../api/client";

/** Landing page for a phone that just scanned a handover slip's QR code — no
 * login, authorization is entirely the signed `token` query param embedded in the
 * QR image itself (see HandoverConfirmTokenService on the backend). Deliberately
 * requires an explicit tap rather than confirming on page load: a QR code can be
 * scanned by accident (e.g. someone just looking at the printed slip out of
 * curiosity), and a GET request that changes state on load would be a CSRF-shaped
 * footgun even though nothing here is destructive. */
export default function HandoverConfirmPage() {
  const { slipId } = useParams<{ slipId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const id = Number(slipId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const infoQuery = useQuery({
    queryKey: ["handover-confirm-info", id, token],
    queryFn: () => getHandoverConfirmInfo(id, token),
    enabled: Number.isFinite(id) && token.length > 0,
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmHandover(id, token),
    onSuccess: () => setErrorMessage(null),
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const info = confirmMutation.data ?? infoQuery.data;
  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%" }}>{children}</div>
    </div>
  );

  if (!Number.isFinite(id) || !token) {
    return wrap(<Result status="error" title="Đường dẫn không hợp lệ" subTitle="Vui lòng quét lại mã QR trên phiếu." />);
  }

  if (infoQuery.isLoading) {
    return wrap(
      <div style={{ textAlign: "center" }}>
        <Spin size="large" />
      </div>,
    );
  }

  if (infoQuery.isError && !confirmMutation.data) {
    return (
      <Result
        status="403"
        title="Mã xác nhận không hợp lệ hoặc đã hết hạn"
        subTitle="Vui lòng liên hệ Trung tâm Hội nghị nếu bạn cho rằng đây là nhầm lẫn."
      />
    );
  }

  if (!info) {
    return wrap(<Spin size="large" />);
  }

  const actionLabel = info.type === "BORROW" ? "Xác nhận đã nhận phòng" : "Xác nhận đã trả phòng";

  if (info.alreadyConfirmed) {
    return wrap(
      <Result
        status="success"
        icon={<CheckCircleOutlined />}
        title="Đã xác nhận"
        subTitle={
          <>
            Phiếu <b>{info.slipNo}</b> ({info.roomName}, đơn {info.bookingCode}) đã được xác nhận
            {info.confirmedAt ? ` lúc ${new Date(info.confirmedAt).toLocaleString("vi-VN")}` : ""}.
          </>
        }
      />,
    );
  }

  return wrap(
    <div style={{ textAlign: "center" }}>
      <Typography.Title level={4}>{actionLabel}</Typography.Title>
      <Typography.Paragraph>
        Phiếu <b>{info.slipNo}</b> — phòng <b>{info.roomName}</b>
        <br />
        Đơn mượn phòng: <b>{info.bookingCode}</b>
        <br />
        Người mượn: {info.borrowerName}
      </Typography.Paragraph>
      {errorMessage && (
        <Typography.Text type="danger" style={{ display: "block", marginBottom: 16 }}>
          {errorMessage}
        </Typography.Text>
      )}
      <Button
        type="primary"
        size="large"
        block
        loading={confirmMutation.isPending}
        onClick={() => confirmMutation.mutate()}
      >
        {actionLabel}
      </Button>
    </div>,
  );
}
