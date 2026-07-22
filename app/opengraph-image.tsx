import { ImageResponse } from "next/og";
import { getSettings } from "@/app/lib/db";

export const alt = "Гоо сайхны салон — онлайн цаг захиалга";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Салоны нэрийг Тохиргооноос уншдаг тул build үед хөлдөөж болохгүй —
// эс тэгвэл нэр солиход хуваалцсан зураг хуучнаараа үлдэнэ.
export const dynamic = "force-dynamic";

export default async function OpengraphImage() {
  const { salonName, tagline } = await getSettings();

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
          {(tagline || "Гоо сайхны салон").toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: salonName.length > 12 ? 92 : 150,
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          {salonName}
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
