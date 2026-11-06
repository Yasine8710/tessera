import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

// The app icon is public/icon.svg (the Tessera tile mark) rendered at 512px for Windows.
const svg = readFileSync(new URL("../public/icon.svg", import.meta.url));
const png = await sharp(svg, { density: 576 }).resize(512, 512).png().toBuffer();
writeFileSync(new URL("../build/icon.png", import.meta.url), png);
console.log("icon.png", png.length);
