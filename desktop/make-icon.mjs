import sharp from "sharp";
import { writeFileSync } from "node:fs";

// Rounded dark tile, teal heartbeat line the CareSync mark, sized for Windows icons.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16424f"/><stop offset="1" stop-color="#0b1f26"/></linearGradient></defs>
<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#g)"/>
<path d="M96 276h82l40-96 64 192 48-128 24 32h62" fill="none" stroke="#5fd0c8" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const png = await sharp(Buffer.from(svg)).resize(512, 512).png().toBuffer();
writeFileSync(new URL("../build/icon.png", import.meta.url), png);
console.log("icon.png", png.length);
