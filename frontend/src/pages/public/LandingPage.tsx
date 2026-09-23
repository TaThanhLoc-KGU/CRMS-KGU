import { useQuery } from "@tanstack/react-query";
import { Button, Col, Row, Skeleton } from "antd";
import { ArrowRightOutlined, CalendarOutlined, FileSearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";
import { getSignage } from "../../api/bookings";
import RoomPlaqueCard from "../../components/RoomPlaqueCard";

export default function LandingPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["public-rooms-highlight"], queryFn: () => listPublicRooms({ size: 8 }) });
  const { data: signage } = useQuery({ queryKey: ["landing-signage"], queryFn: getSignage, refetchInterval: 30_000 });

  return (
    <div>
      {/* ---- Hero: plain text + CTAs on the left, a live "right now" room-
          status panel on the right — real data, not a decorative graphic. */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "88px 32px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 56,
            alignItems: "center",
          }}
          className="crms-hero-grid"
        >
          <div>
            <div className="crms-eyebrow" style={{ marginBottom: 18 }}>Trường Đại học Kiên Giang</div>
            <h1
              style={{
                fontSize: "clamp(34px, 4vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "var(--ink-800)",
                margin: "0 0 20px",
                maxWidth: 640,
              }}
            >
              Đặt phòng họp nhanh gọn, không cần gọi điện
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--slate-500)", maxWidth: 480, margin: "0 0 36px" }}>
              Xem lịch trống, gửi đơn đăng ký mượn phòng của Trung tâm Hội nghị, và nhận kết quả duyệt qua email —
              toàn bộ trên một trang.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end" onClick={() => navigate("/rooms")}>
                Xem danh sách phòng
              </Button>
              <Button size="large" icon={<CalendarOutlined />} onClick={() => navigate("/calendar")}>
                Xem lịch phòng
              </Button>
              <Button size="large" icon={<FileSearchOutlined />} onClick={() => navigate("/lookup")}>
                Tra cứu đơn đã nộp
              </Button>
            </div>
          </div>

          {/* Live status card — real data, refetched every 30s like the signage screen */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-2)",
              padding: "20px 20px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="crms-eyebrow" style={{ marginBottom: 0 }}>Ngay bây giờ</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary-500)" }} />
            </div>
            {(signage ?? []).slice(0, 5).map((room) => (
              <div
                key={room.roomId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--ink-800)", fontWeight: 500 }}>{room.roomCode}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "2px 9px",
                    borderRadius: 6,
                    color: room.occupied ? "var(--danger-700)" : "var(--primary-700)",
                    background: room.occupied ? "var(--danger-100)" : "var(--primary-100)",
                  }}
                >
                  {room.occupied ? "ĐANG HỌP" : "TRỐNG"}
                </span>
              </div>
            ))}
            {!signage && (
              <div style={{ padding: "16px 0" }}>
                <Skeleton active title={false} paragraph={{ rows: 3 }} />
              </div>
            )}
            <Button type="link" size="small" style={{ paddingLeft: 0, marginTop: 6 }} onClick={() => navigate("/man-hinh")}>
              Xem toàn bộ trạng thái phòng →
            </Button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 88px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
          <div>
            <div className="crms-eyebrow" style={{ marginBottom: 8 }}>Không gian</div>
            <h2 style={{ fontSize: 26, color: "var(--ink-800)", margin: 0 }}>Một số phòng nổi bật</h2>
          </div>
          <Button type="link" onClick={() => navigate("/rooms")}>
            Xem tất cả phòng →
          </Button>
        </div>

        {isLoading ? (
          <Skeleton active />
        ) : (
          <Row gutter={[20, 20]}>
            {data?.content.map((room) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={room.id}>
                <RoomPlaqueCard room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </div>
  );
}
