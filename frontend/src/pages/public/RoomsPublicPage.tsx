import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Col, Empty, InputNumber, Row, Space, Typography, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { listPublicRooms } from "../../api/rooms";
import RoomPlaqueCard from "../../components/RoomPlaqueCard";

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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 72px" }}>
      <div className="crms-eyebrow" style={{ marginBottom: 10 }}>Trung tâm Hội nghị</div>
      <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        Danh sách phòng
      </Typography.Title>
      <Space wrap style={{ marginBottom: 28 }}>
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

      <Row gutter={[20, 20]}>
        {data?.content.map((room) => (
          <Col xs={24} sm={12} md={8} key={room.id}>
            <RoomPlaqueCard room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
