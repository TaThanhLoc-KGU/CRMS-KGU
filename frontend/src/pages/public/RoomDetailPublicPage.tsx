import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Descriptions, Image, Skeleton, Space, Typography } from "antd";
import { getPublicRoom } from "../../api/rooms";

export default function RoomDetailPublicPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const { data: room, isLoading } = useQuery({ queryKey: ["public-room", id], queryFn: () => getPublicRoom(id) });

  if (isLoading || !room) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 72px" }}>
      {room.images.length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap style={{ marginBottom: 28 }}>
            {room.images.map((img) => (
              <Image
                key={img.id}
                src={img.url}
                alt={img.caption ?? room.name}
                width={200}
                height={140}
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : room.thumbnailUrl ? (
        <img
          src={room.thumbnailUrl}
          alt={room.name}
          style={{ width: "100%", maxHeight: 320, objectFit: "cover", marginBottom: 28, borderRadius: 4 }}
        />
      ) : (
        <div
          className="crms-plaque-media"
          style={{ height: 200, borderRadius: 4, marginBottom: 28 }}
        >
          <span className="crms-plaque-glyph">{room.code}</span>
        </div>
      )}

      <div className="crms-eyebrow" style={{ marginBottom: 8 }}>{room.code}</div>
      <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 24 }}>
        {room.name}
      </Typography.Title>

      <Descriptions
        bordered
        column={2}
        style={{ marginBottom: 28, background: "var(--paper-0)" }}
        labelStyle={{ background: "var(--brass-100)", color: "var(--ink-800)", fontWeight: 600 }}
      >
        <Descriptions.Item label="Tòa nhà">{room.building ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Tầng">{room.floor ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Sức chứa">{room.capacity ?? "-"} người</Descriptions.Item>
        <Descriptions.Item label="Diện tích">{room.areaM2 ? `${room.areaM2} m²` : "-"}</Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>
          {room.description ?? "Chưa có mô tả"}
        </Descriptions.Item>
      </Descriptions>

      <Button type="primary" size="large" onClick={() => navigate(`/booking/new?roomId=${room.id}`)}>
        Đăng ký mượn phòng này
      </Button>
    </div>
  );
}
