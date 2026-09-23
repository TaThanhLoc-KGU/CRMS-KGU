import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "antd";
import { getSignage } from "../../api/bookings";

const REFRESH_MS = 30_000;

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** Digital signage screen (spec §16 item 12) — meant for a TV outside a room or in
 * a lobby, not for a person browsing on their own device: full-screen, no site
 * navigation, large text readable from a few meters away, auto-refreshing so no
 * one needs to touch it. Public and read-only, same privacy rule as the public
 * calendar — shows "Đang họp / Trống", never who's meeting. */
export default function SignagePage() {
  const [now, setNow] = useState(new Date());
  const { data: rooms } = useQuery({
    queryKey: ["signage"],
    queryFn: getSignage,
    refetchInterval: REFRESH_MS,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
        <Typography.Title level={2} style={{ color: "#f8fafc", margin: 0 }}>
          Trung tâm Hội nghị — Trường Đại học Kiên Giang
        </Typography.Title>
        <div style={{ fontSize: 32, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {now.toLocaleTimeString("vi-VN")} — {now.toLocaleDateString("vi-VN")}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {(rooms ?? []).map((room) => (
          <div
            key={room.roomId}
            style={{
              borderRadius: 12,
              padding: 20,
              background: room.occupied ? "#7f1d1d" : "#14532d",
              border: `2px solid ${room.occupied ? "#ef4444" : "#22c55e"}`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700 }}>{room.roomCode}</div>
            <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 12 }}>{room.roomName}</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{room.occupied ? "ĐANG HỌP" : "TRỐNG"}</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 8 }}>
              {room.occupied && room.occupiedUntil && <>Đến {formatTime(room.occupiedUntil)}</>}
              {!room.occupied && room.nextStart && <>Lịch tiếp theo: {formatTime(room.nextStart)}</>}
              {!room.occupied && !room.nextStart && <>Không có lịch trong 24h tới</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
