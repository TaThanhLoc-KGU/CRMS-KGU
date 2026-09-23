import type { Room } from "../api/rooms";

interface RoomPlaqueCardProps {
  room: Pick<Room, "id" | "code" | "name" | "building" | "floor" | "capacity" | "thumbnailUrl">;
  onClick?: () => void;
}

/** A room rendered like an engraved door plaque rather than a stock photo card —
 * see index.css's design-system header comment for why. Falls back to the room's
 * code set in Fraunces when there's no photo, which is the common case for this
 * seed data and looks intentional rather than like a missing image. */
export default function RoomPlaqueCard({ room, onClick }: RoomPlaqueCardProps) {
  return (
    <div className="crms-plaque" onClick={onClick}>
      {room.thumbnailUrl ? (
        <img
          alt={room.name}
          src={room.thumbnailUrl}
          style={{ height: 148, width: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div className="crms-plaque-media">
          <span className="crms-plaque-glyph">{room.code}</span>
        </div>
      )}
      <div style={{ padding: "16px 18px 18px" }}>
        <div className="crms-plaque-code">{room.code}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--ink-800)", margin: "2px 0 8px" }}>
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
              borderRadius: 4,
              background: "var(--paddy-100)",
              color: "var(--paddy-700)",
            }}
          >
            Sức chứa {room.capacity} người
          </span>
        )}
      </div>
    </div>
  );
}
