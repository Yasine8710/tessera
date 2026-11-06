import { ImageResponse } from "next/og";

export const alt = "Tessera: Connected care. Better everyday health.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social images cannot read CSS variables; these literals mirror the light-theme tokens in globals.css.
const INK = "#151a22";
const MUTED = "#596273";
const ACCENT = "#2557a7";
const BG = "#f4f5f7";
const LINE = "#dde1e8";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: BG, color: INK, borderLeft: `16px solid ${ACCENT}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 64 64">
            <g fill={INK}>
              <rect x="4" y="4" width="16" height="16" rx="2.5" />
              <rect x="24" y="4" width="16" height="16" rx="2.5" />
              <rect x="44" y="4" width="16" height="16" rx="2.5" />
              <rect x="24" y="24" width="16" height="16" rx="2.5" />
            </g>
            <rect x="24" y="44" width="16" height="16" rx="2.5" fill={ACCENT} />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 700 }}>Tessera</div>
        </div>
        <div style={{ marginTop: 56, fontSize: 60, lineHeight: 1.15, maxWidth: 900, fontWeight: 600 }}>Better care starts with staying connected.</div>
        <div style={{ marginTop: 36, paddingTop: 28, borderTop: `2px solid ${LINE}`, fontSize: 30, color: MUTED }}>Medication, routines and follow-up in one place.</div>
      </div>
    ),
    size,
  );
}
