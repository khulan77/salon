import { ImageResponse } from "next/og";

export const alt = "Lumière — Гоо сайхны салон";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 500px at 80% -10%, #f3e3e3, transparent), #faf6f1",
          color: "#2e2723",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 8,
            color: "#b76e79",
            fontWeight: 600,
          }}
        >
          ГОО САЙХНЫ САЛОН
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 150,
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          Lumière
          <div
            style={{
              width: 44,
              height: 44,
              background: "#b76e79",
              marginLeft: 28,
              transform: "rotate(45deg)",
              borderRadius: 8,
            }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#8a7d72", marginTop: 20 }}>
          Онлайн цаг захиалга · Мэргэжлийн мастерууд
        </div>
      </div>
    ),
    { ...size },
  );
}
