import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, InputNumber, Row, Space, Tag, Typography, Input } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";

export default function RoomsPublicPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [minCapacity, setMinCapacity] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-rooms", keyword, minCapacity, floor],
    queryFn: () =>
      listPublicRooms({
        size: 50,
        keyword: keyword || undefined,
        minCapacity: minCapacity ?? undefined,
        floor: floor ?? undefined,
      }),
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <Typography.Title level={3}>Danh sách phòng</Typography.Title>
      <Space wrap style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="Tìm theo tên phòng"
          allowClear
          onSearch={setKeyword}
          style={{ width: 240 }}
        />
        <InputNumber placeholder="Tầng" min={1} style={{ width: 120 }} onChange={(v) => setFloor(v)} />
        <InputNumber
          placeholder="Sức chứa tối thiểu"
          min={1}
          style={{ width: 180 }}
          onChange={(v) => setMinCapacity(v)}
        />
      </Space>

      {!isLoading && data?.content.length === 0 && <Empty description="Không tìm thấy phòng phù hợp" />}

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
                  <div
                    style={{
                      height: 160,
                      background: "#f0f2f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HomeOutlined style={{ fontSize: 32, color: "#bbb" }} />
                  </div>
                )
              }
            >
              <Card.Meta
                title={`${room.code} — ${room.name}`}
                description={
                  <Space direction="vertical" size={4}>
                    <span>
                      {room.building} {room.floor ? `— Tầng ${room.floor}` : ""}
                    </span>
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
