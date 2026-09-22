/**
 * Generates placeholder PNG assets for Expo.
 * Creates a dark navy background with a simple 2x2 grid icon (Eisenhower Matrix).
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPNG(width, height, bgColor, drawFn) {
  // bgColor: [r, g, b]
  const pixels = new Uint8Array(width * height * 4);
  // Fill background
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4 + 0] = bgColor[0];
    pixels[i * 4 + 1] = bgColor[1];
    pixels[i * 4 + 2] = bgColor[2];
    pixels[i * 4 + 3] = 255;
  }
  if (drawFn) drawFn(pixels, width, height);

  // Build raw image data (filter byte 0 before each scanline)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      rawData[dst + 0] = pixels[src + 0];
      rawData[dst + 1] = pixels[src + 1];
      rawData[dst + 2] = pixels[src + 2];
      rawData[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  function crc32(buf) {
    const table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c;
      }
      return t;
    })();
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.concat([typeBytes, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf));
    return Buffer.concat([len, typeBytes, data, crc]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  const ihdr = chunk("IHDR", ihdrData);
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0) return;
  const i = (y * width + x) * 4;
  pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
}

function fillRect(pixels, width, height, x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < Math.min(y0 + h, height); y++) {
    for (let x = x0; x < Math.min(x0 + w, width); x++) {
      setPixel(pixels, width, x, y, r, g, b, a);
    }
  }
}

// Color palette
const DARK_NAVY = [15, 23, 42];      // #0F172A
const RED = [239, 68, 68];           // #EF4444
const AMBER = [245, 158, 11];        // #F59E0B
const BLUE = [59, 130, 246];         // #3B82F6
const GREEN = [34, 197, 94];         // #22C55E
const WHITE = [255, 255, 255];
const DIVIDER = [51, 65, 85];        // #334155

function drawEisenhowerIcon(pixels, size) {
  const pad = Math.floor(size * 0.12);
  const inner = size - pad * 2;
  const half = Math.floor(inner / 2);
  const gap = Math.max(2, Math.floor(size * 0.02));

  // Q1: Do First (top-left) — Red
  fillRect(pixels, size, size, pad, pad, half - gap, half - gap, ...RED);
  // Q2: Schedule (top-right) — Blue
  fillRect(pixels, size, size, pad + half + gap, pad, half - gap, half - gap, ...BLUE);
  // Q3: Delegate (bottom-left) — Amber
  fillRect(pixels, size, size, pad, pad + half + gap, half - gap, half - gap, ...AMBER);
  // Q4: Eliminate (bottom-right) — lighter gray
  fillRect(pixels, size, size, pad + half + gap, pad + half + gap, half - gap, half - gap, ...GREEN);
}

function drawAdaptiveIcon(pixels, size) {
  // Slightly larger padding for adaptive icon safe zone
  const pad = Math.floor(size * 0.18);
  const inner = size - pad * 2;
  const half = Math.floor(inner / 2);
  const gap = Math.max(3, Math.floor(size * 0.025));

  fillRect(pixels, size, size, pad, pad, half - gap, half - gap, ...RED);
  fillRect(pixels, size, size, pad + half + gap, pad, half - gap, half - gap, ...BLUE);
  fillRect(pixels, size, size, pad, pad + half + gap, half - gap, half - gap, ...AMBER);
  fillRect(pixels, size, size, pad + half + gap, pad + half + gap, half - gap, half - gap, ...GREEN);
}

function drawSplash(pixels, width, height) {
  // Small centered icon on dark background
  const iconSize = Math.floor(Math.min(width, height) * 0.25);
  const ox = Math.floor((width - iconSize) / 2);
  const oy = Math.floor((height - iconSize) / 2);
  const half = Math.floor(iconSize / 2);
  const gap = Math.max(2, Math.floor(iconSize * 0.03));
  const pad = Math.floor(iconSize * 0.05);

  fillRect(pixels, width, height, ox + pad, oy + pad, half - gap - pad, half - gap - pad, ...RED);
  fillRect(pixels, width, height, ox + half + gap, oy + pad, half - gap - pad, half - gap - pad, ...BLUE);
  fillRect(pixels, width, height, ox + pad, oy + half + gap, half - gap - pad, half - gap - pad, ...AMBER);
  fillRect(pixels, width, height, ox + half + gap, oy + half + gap, half - gap - pad, half - gap - pad, ...GREEN);
}

function drawFeatureGraphic(pixels, width, height) {
  // Title area + icon centered
  const iconSize = Math.floor(height * 0.45);
  const ox = Math.floor((width - iconSize) / 2);
  const oy = Math.floor((height - iconSize) / 2) - Math.floor(height * 0.05);
  const half = Math.floor(iconSize / 2);
  const gap = Math.max(3, Math.floor(iconSize * 0.03));
  const pad = Math.floor(iconSize * 0.04);

  fillRect(pixels, width, height, ox + pad, oy + pad, half - gap - pad, half - gap - pad, ...RED);
  fillRect(pixels, width, height, ox + half + gap, oy + pad, half - gap - pad, half - gap - pad, ...BLUE);
  fillRect(pixels, width, height, ox + pad, oy + half + gap, half - gap - pad, half - gap - pad, ...AMBER);
  fillRect(pixels, width, height, ox + half + gap, oy + half + gap, half - gap - pad, half - gap - pad, ...GREEN);
}

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

// icon.png — 512×512
const icon = createPNG(512, 512, DARK_NAVY, (p, w, h) => drawEisenhowerIcon(p, 512));
fs.writeFileSync(path.join(assetsDir, "icon.png"), icon);
console.log("✓ icon.png (512×512)");

// adaptive-icon.png — 1024×1024
const adaptive = createPNG(1024, 1024, DARK_NAVY, (p, w, h) => drawAdaptiveIcon(p, 1024));
fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), adaptive);
console.log("✓ adaptive-icon.png (1024×1024)");

// splash-icon.png — 1284×2778 (iPhone 14 Pro Max size, works well as splash)
const splash = createPNG(1284, 2778, DARK_NAVY, drawSplash);
fs.writeFileSync(path.join(assetsDir, "splash-icon.png"), splash);
console.log("✓ splash-icon.png (1284×2778)");

// favicon.png — 48×48
const favicon = createPNG(48, 48, DARK_NAVY, (p, w, h) => drawEisenhowerIcon(p, 48));
fs.writeFileSync(path.join(assetsDir, "favicon.png"), favicon);
console.log("✓ favicon.png (48×48)");

console.log("\nAll assets generated in ./assets/");
console.log("For better quality, replace with properly designed assets before publishing.");
