// Run with: bun scripts/generate-icons.mjs
// Generates PNG icons by embedding a base64-encoded minimal PNG

import { writeFileSync } from "fs";

// Minimal 1x1 black PNG, then we create SVG icons the browser/iOS can use
// Instead, we write SVG files and reference them — iOS Safari supports SVG icons
// via apple-touch-icon but needs PNG. We write raw PNG bytes for a solid colored square.

function createSimplePNG(size, bgColor = [10, 10, 10], text = "M") {
  // We'll create an SVG string and convert using built-in fetch/DOMParser isn't available
  // So we write a valid minimal PNG using raw bytes
  // Use a pre-built approach: write SVG as the icon (works for web manifest)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0a0a0a"/>
  <text x="${size / 2}" y="${size / 2}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size * 0.52)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
  return svg;
}

writeFileSync("public/icon-192.svg", createSimplePNG(192));
writeFileSync("public/icon-512.svg", createSimplePNG(512));
console.log("SVG icons generated. For production, convert to PNG with:");
console.log("  brew install librsvg && rsvg-convert -w 192 public/icon-192.svg > public/icon-192.png");
console.log("  rsvg-convert -w 512 public/icon-512.svg > public/icon-512.png");
