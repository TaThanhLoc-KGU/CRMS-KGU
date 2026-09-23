import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { CalendarOutlined, FileSearchOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";

export default function LandingPage() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["public-rooms-highlight"], queryFn: () => listPublicRooms({ size: 6 }) });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Typography.Title level={2}>Trung tâm Hội nghị — Trường Đại học Kiên Giang</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 16 }}>
          Đăng ký mượn phòng họp, hội thảo trực tuyến — nhanh chóng, minh bạch, không cần gọi điện.
        </Typography.Paragraph>
        <Space size="middle" style={{ marginTop: 16 }}>
          <Button type="primary" size="large" icon={<HomeOutlined />} onClick={() => navigate("/rooms")}>
            Xem danh sách phòng
          </Button>
          <Button size="large" icon={<CalendarOutlined />} onClick={() => navigate("/calendar")}>
            Xem lịch phòng
          </Button>
          <Button size="large" icon={<FileSearchOutlined />} onClick={() => navigate("/lookup")}>
            Tra cứu đơn đã nộp
          </Button>
        </Space>
      </div>

      <Typography.Title level={4}>Một số phòng nổi bật</Typography.Title>
      <Row gutter={[16, 16]}>
        {data?.content.map((room) => (
          <Col xs={24} sm={12} md={8} key={room.id}>
            <Card
              hoverable
              onClick={() => navigate(`/rooms/${room.id}`)}
              cover={
                room.thumbnailUrl ? (
                  <img alt={room.name} src={room.thumbnailUrl} style={{ height: 160, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 160, background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <HomeOutlined style={{ fontSize: 32, color: "#bbb" }} />
                  </div>
                )
              }
            >
              <Card.Meta
                title={room.name}
                description={
                  <Space direction="vertical" size={4}>
                    <span>{room.building} {room.floor ? `— Tầng ${room.floor}` : ""}</span>
                    {room.capacity && <Tag color="blue">Sức chứa {room.capacity} người</Tag>}
                  </Space>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
