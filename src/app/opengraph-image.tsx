import { ImageResponse } from "next/og";

export const alt = "CareSync: Connected care. Better everyday health.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: "#0f2a33", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#16414d" />
            <path d="M14 33h9l5-12 8 24 6-16 3 4h5" fill="none" stroke="#5fd0c8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 72, fontWeight: 700 }}>CareSync</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 56, lineHeight: 1.15, maxWidth: 900 }}>Better care starts with staying connected.</div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#5fd0c8" }}>Connected care. Better everyday health.</div>
      </div>
    ),
    size,
  );
}
