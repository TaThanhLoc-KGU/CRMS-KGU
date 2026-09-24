import { useQuery } from "@tanstack/react-query";
import { Button, Carousel, Col, Row, Skeleton } from "antd";
import { ArrowRightOutlined, CalendarOutlined, FileSearchOutlined, PictureOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";
import { getSignage } from "../../api/bookings";
import { getPublicLanding } from "../../api/landing";
import RoomPlaqueCard from "../../components/RoomPlaqueCard";

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: content } = useQuery({ queryKey: ["landing-content"], queryFn: getPublicLanding });
  const { data, isLoading } = useQuery({ queryKey: ["public-rooms-highlight"], queryFn: () => listPublicRooms({ size: 8 }) });
  const { data: signage } = useQuery({ queryKey: ["landing-signage"], queryFn: getSignage, refetchInterval: 30_000 });

  const slides = content?.slides ?? [];

  return (
    <div>
      {/* Full-bleed, 16:9 hero carousel — content (images, headline, subheadline)
          is admin-editable: slides at Quản trị > Nội dung trang chủ, text at
          Quản trị > Cấu hình > Trang chủ. Nothing here is hardcoded copy. */}
      <div className="crms-hero-carousel" style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: "var(--primary-100)" }}>
        {slides.length > 0 ? (
          <Carousel autoplay style={{ height: "100%" }}>
            {slides.map((slide) => (
              <div key={slide.id} style={{ height: "100%" }}>
                <img
                  src={slide.imageUrl}
                  alt={slide.caption ?? ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </Carousel>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PictureOutlined style={{ fontSize: 40, color: "var(--primary-600)" }} />
          </div>
        )}
      </div>

      <section>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "56px 32px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 56,
            alignItems: "center",
          }}
          className="crms-hero-grid"
        >
          <div>
            <div className="crms-eyebrow" style={{ marginBottom: 18 }}>{content?.eyebrow}</div>
            <h1
              style={{
                fontSize: "clamp(30px, 3.4vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "var(--ink-800)",
                margin: "0 0 20px",
                maxWidth: 640,
              }}
            >
              {content?.headline}
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--slate-500)", maxWidth: 480, margin: "0 0 36px" }}>
              {content?.subheadline}
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
          <div className="crms-glass" style={{ padding: "20px 20px 14px" }}>
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
