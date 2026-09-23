import { useQuery } from "@tanstack/react-query";
import { Button, Col, Row, Skeleton } from "antd";
import { ArrowRightOutlined, CalendarOutlined, FileSearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";
import RoomPlaqueCard from "../../components/RoomPlaqueCard";

export default function LandingPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["public-rooms-highlight"], queryFn: () => listPublicRooms({ size: 6 }) });

  return (
    <div>
      <section
        style={{
          background: "linear-gradient(165deg, var(--ink-900), var(--ink-700) 78%)",
          padding: "72px 24px 88px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="crms-eyebrow" style={{ justifyContent: "center", marginBottom: 20 }}>
            Trường Đại học Kiên Giang
            <span style={{ width: 18, height: 1, background: "var(--brass-500)" }} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 600,
              lineHeight: 1.15,
              color: "var(--paper-0)",
              margin: "0 0 20px",
            }}
          >
            Đặt một phòng họp,
            <br />
            <em style={{ color: "var(--brass-300)", fontStyle: "italic" }}>trang trọng như một buổi lễ.</em>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(251,249,244,0.72)", maxWidth: 560, margin: "0 auto 36px" }}>
            Đăng ký mượn phòng của Trung tâm Hội nghị — xem lịch trống, gửi đơn, nhận kết quả duyệt qua email.
            Không cần gọi điện, không cần chờ đợi.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={() => navigate("/rooms")}
            >
              Xem danh sách phòng
            </Button>
            <Button
              size="large"
              icon={<CalendarOutlined />}
              ghost
              onClick={() => navigate("/calendar")}
            >
              Xem lịch phòng
            </Button>
            <Button
              size="large"
              icon={<FileSearchOutlined />}
              ghost
              onClick={() => navigate("/lookup")}
            >
              Tra cứu đơn đã nộp
            </Button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 72px" }}>
        <div className="crms-eyebrow" style={{ marginBottom: 10 }}>Không gian</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink-800)", margin: "0 0 28px" }}>
          Một số phòng nổi bật
        </h2>

        {isLoading ? (
          <Skeleton active />
        ) : (
          <Row gutter={[20, 20]}>
            {data?.content.map((room) => (
              <Col xs={24} sm={12} md={8} key={room.id}>
                <RoomPlaqueCard room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </div>
  );
}
