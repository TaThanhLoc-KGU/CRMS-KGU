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
      {/* ---- Hero: text + CTAs on the left, a live "right now" room-status
          panel on the right — the most characteristic real thing this app
          does (tells you if a room is free right now), not a static graphic. */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(150deg, var(--ink-900), var(--ink-700) 85%)",
        }}
      >
        <svg
          aria-hidden
          width="900"
          height="900"
          viewBox="0 0 900 900"
          style={{ position: "absolute", top: "-260px", right: "-320px", opacity: 0.5, pointerEvents: "none" }}
        >
          <circle cx="450" cy="450" r="430" fill="none" stroke="var(--brass-500)" strokeOpacity="0.16" strokeWidth="1" />
          <circle cx="450" cy="450" r="360" fill="none" stroke="var(--brass-500)" strokeOpacity="0.22" strokeWidth="1" />
          <circle cx="450" cy="450" r="300" fill="none" stroke="var(--brass-500)" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="2 10" />
        </svg>

        <div
          style={{
            position: "relative",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "104px 32px 120px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 56,
            alignItems: "center",
          }}
          className="crms-hero-grid"
        >
          <div>
            <div className="crms-eyebrow" style={{ marginBottom: 22 }}>
              Trường Đại học Kiên Giang
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 4.6vw, 68px)",
                fontWeight: 600,
                lineHeight: 1.08,
                color: "var(--paper-0)",
                margin: "0 0 26px",
                maxWidth: 680,
              }}
            >
              Đặt một phòng họp,
              <br />
              <em style={{ color: "var(--brass-300)", fontStyle: "italic" }}>trang trọng như một buổi lễ.</em>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(251,249,244,0.72)", maxWidth: 480, margin: "0 0 40px" }}>
              Đăng ký mượn phòng của Trung tâm Hội nghị — xem lịch trống, gửi đơn, nhận kết quả duyệt qua email.
              Không cần gọi điện, không cần chờ đợi.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end" onClick={() => navigate("/rooms")}>
                Xem danh sách phòng
              </Button>
              <Button size="large" icon={<CalendarOutlined />} ghost onClick={() => navigate("/calendar")}>
                Xem lịch phòng
              </Button>
              <Button size="large" icon={<FileSearchOutlined />} ghost onClick={() => navigate("/lookup")}>
                Tra cứu đơn đã nộp
              </Button>
            </div>
          </div>

          {/* Live status card — real data, refetched every 30s like the signage screen */}
          <div
            style={{
              background: "var(--paper-0)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--paper-line)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.5)",
              padding: "22px 22px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span className="crms-eyebrow" style={{ marginBottom: 0 }}>Ngay bây giờ</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--paddy-500)", boxShadow: "0 0 0 3px var(--paddy-100)" }} />
            </div>
            {(signage ?? []).slice(0, 5).map((room) => (
              <div
                key={room.roomId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderTop: "1px solid var(--paper-line)",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--ink-800)", fontWeight: 500 }}>{room.roomCode}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "2px 9px",
                    borderRadius: 4,
                    color: room.occupied ? "var(--lacquer-700)" : "var(--paddy-700)",
                    background: room.occupied ? "var(--lacquer-100)" : "var(--paddy-100)",
                  }}
                >
                  {room.occupied ? "ĐANG HỌP" : "TRỐNG"}
                </span>
              </div>
            ))}
            {!signage && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Skeleton active title={false} paragraph={{ rows: 3 }} />
              </div>
            )}
            <Button type="link" size="small" style={{ paddingLeft: 0, marginTop: 6 }} onClick={() => navigate("/man-hinh")}>
              Xem toàn bộ trạng thái phòng →
            </Button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 32px 96px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
          <div>
            <div className="crms-eyebrow" style={{ marginBottom: 10 }}>Không gian</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink-800)", margin: 0 }}>
              Một số phòng nổi bật
            </h2>
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
