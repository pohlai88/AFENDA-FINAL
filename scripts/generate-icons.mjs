/**
 * Generate Official Afenda PWA Icons from SVG
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'app', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Official Afenda Icon SVG generator
function generateAfendaIconSVG(size) {
  const scale = size / 512;
  
  // Scale all coordinates
  const triPath = `M${256 * scale} ${56 * scale} L${472 * scale} ${456 * scale} L${40 * scale} ${456 * scale} Z`;
  
  const rect1 = { x: 148 * scale, y: 280 * scale, w: 140 * scale, h: 26 * scale, rx: 4 * scale };
  const rect2 = { x: 148 * scale, y: 330 * scale, w: 100 * scale, h: 26 * scale, rx: 4 * scale };
  const rect3 = { x: 148 * scale, y: 380 * scale, w: 140 * scale, h: 26 * scale, rx: 4 * scale };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
  <!-- Official Afenda Icon ${size}x${size} -->
  <path d="${triPath}" fill="#000"/>
  <rect x="${rect1.x}" y="${rect1.y}" width="${rect1.w}" height="${rect1.h}" rx="${rect1.rx}" fill="#fff"/>
  <rect x="${rect2.x}" y="${rect2.y}" width="${rect2.w}" height="${rect2.h}" rx="${rect2.rx}" fill="#fff"/>
  <rect x="${rect3.x}" y="${rect3.y}" width="${rect3.w}" height="${rect3.h}" rx="${rect3.rx}" fill="#fff"/>
</svg>`;
}

// Generate SVG icons for each size
for (const size of sizes) {
  const svg = generateAfendaIconSVG(size);
  const filename = join(iconsDir, `icon-${size}x${size}.svg`);
  writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
}

console.log('\\n✅ All Official Afenda icons generated!');
console.log('\\nTo convert to PNG, use: npx sharp-cli or similar tool');
