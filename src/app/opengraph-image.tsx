import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/config";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Gambar pratinjau saat link dibagikan (WhatsApp, Telegram, dll.)
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          color: "white",
          backgroundColor: "#07060d",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(124,58,237,0.55), rgba(7,6,13,0) 55%), radial-gradient(circle at 90% 90%, rgba(217,70,239,0.40), rgba(7,6,13,0) 50%)",
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "linear-gradient(135deg, #8b5cf6, #d946ef 55%, #ec4899)",
            boxShadow: "0 24px 80px rgba(217,70,239,0.45)",
          }}
        >
          <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
            <path d="M5 21h14" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 64 }}>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{SITE_NAME}</div>
          <div style={{ marginTop: 22, fontSize: 36, lineHeight: 1.35, color: "rgba(255,255,255,0.7)", maxWidth: 700 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
