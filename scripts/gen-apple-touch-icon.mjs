// Run with: bun scripts/gen-apple-touch-icon.mjs
// Renders apple-touch-icon.png (180x180) from SVG with pixel art scaled to ~75%
// to match the proportions of favicon-48.png (more padding around moon/stars).

import sharp from "sharp";
import { writeFileSync } from "fs";

// Content bounding box in icon-192.svg's 200x200 viewBox:
//   moon: x=10..130, y=22..178
//   stars: x=142..184, y=22..82
// Combined: x=10..184 (w=174), y=22..178 (h=156), center=(97,100)
// Scale 0.75 → content width = 130.5 (65% of 200), centered with equal padding

const s = 0.75;
const cx = 97, cy = 100; // content center
const tx = 100 - s * cx; // 27.25
const ty = 100 - s * cy; // 25

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="24" fill="#BCE8DC"/>
  <g transform="translate(${tx}, ${ty}) scale(${s})">
    <!-- moon pixels (#1F2024) -->
    <rect x="46" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="82" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="94" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="106" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="118" y="22" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="82" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="94" y="34" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="46" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="46" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="46" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="46" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="46" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="58" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="58" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="58" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="58" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="58" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="70" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="70" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="70" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="70" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="70" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="82" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="82" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="82" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="82" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="94" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="94" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="94" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="94" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="106" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="106" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="106" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="106" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="118" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="118" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="118" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="118" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="118" width="12" height="12" fill="#1F2024"/>
    <rect x="10" y="130" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="130" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="130" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="130" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="130" width="12" height="12" fill="#1F2024"/>
    <rect x="22" y="142" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="142" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="142" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="142" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="142" width="12" height="12" fill="#1F2024"/>
    <rect x="34" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="82" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="94" y="154" width="12" height="12" fill="#1F2024"/>
    <rect x="46" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="58" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="70" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="82" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="94" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="106" y="166" width="12" height="12" fill="#1F2024"/>
    <rect x="118" y="166" width="12" height="12" fill="#1F2024"/>
    <!-- stars (#1F2024) -->
    <rect x="142" y="22" width="24" height="24" fill="#1F2024"/>
    <rect x="166" y="46" width="18" height="18" fill="#1F2024"/>
    <rect x="142" y="70" width="12" height="12" fill="#1F2024"/>
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toBuffer();

writeFileSync("public/apple-touch-icon.png", png);
console.log("Written public/apple-touch-icon.png (180x180)");
