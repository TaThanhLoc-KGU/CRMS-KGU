import { BankOutlined } from "@ant-design/icons";
import type { Room } from "../api/rooms";

interface RoomPlaqueCardProps {
  room: Pick<Room, "id" | "code" | "name" | "building" | "floor" | "capacity" | "thumbnailUrl">;
  onClick?: () => void;
}

/** A flat, minimal room card. Falls back to a plain tinted icon block when
 * there's no photo, which is the common case for this seed data. */
export default function RoomPlaqueCard({ room, onClick }: RoomPlaqueCardProps) {
  return (
    <div className="crms-plaque" onClick={onClick}>
      {room.thumbnailUrl ? (
        <img
          alt={room.name}
          src={room.thumbnailUrl}
          style={{ height: 140, width: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div className="crms-plaque-media">
          <BankOutlined style={{ fontSize: 28 }} />
        </div>
      )}
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="crms-plaque-code">{room.code}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-800)", margin: "2px 0 6px" }}>
          {room.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--slate-500)", marginBottom: room.capacity ? 10 : 0 }}>
          {[room.building, room.floor ? `Tầng ${room.floor}` : null].filter(Boolean).join(" — ") || "Trung tâm Hội nghị"}
        </div>
        {room.capacity && (
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 6,
              background: "var(--primary-100)",
              color: "var(--primary-700)",
            }}
          >
            Sức chứa {room.capacity} người
          </span>
        )}
      </div>
    </div>
  );
}
