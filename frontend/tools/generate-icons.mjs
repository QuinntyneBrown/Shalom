/**
 * Rasterizes the Shalom "dawn" mark (cedar-teal field, rising gold half-sun
 * over a warm horizon line) into the PWA icon set, using the Playwright
 * chromium already installed for the e2e suite (e2e/node_modules — no new
 * frontend dependency).
 *
 *   node tools/generate-icons.mjs        (run from frontend/)
 *
 * Outputs (all under projects/shalom/public):
 *   icons/icon-192.png            manifest, purpose "any"
 *   icons/icon-512.png            manifest, purpose "any"
 *   icons/icon-maskable-512.png   manifest, purpose "maskable" (mark scaled
 *                                 ~80% inside the full-bleed teal field so
 *                                 round/squircle masks never clip the sun)
 *   apple-touch-icon.png          180×180 for the iOS home screen
 *   favicon.png                   64×64 browser-tab icon
 */

import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../e2e/package.json', import.meta.url));
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', 'projects', 'shalom', 'public');
const iconsDir = path.join(publicDir, 'icons');

/**
 * The dawn mark. Geometry notes (512 viewBox):
 *   - sun: upper half-disc r=90 centered (256, 306), so its top is y=216;
 *   - horizon: warm white bar y=300..310 across x=96..416;
 *   - rays radiate from the sun's center (256, 306): one vertical, two at
 *     ±35° — each ray's inner end keeps a 40px breathing gap to the disc.
 */
const MARK = `
  <radialGradient id="g">
    <stop offset="0" stop-color="#D8B36A" stop-opacity=".4"/>
    <stop offset="1" stop-color="#D8B36A" stop-opacity="0"/>
  </radialGradient>
  <circle cx="256" cy="306" r="160" fill="url(#g)"/>
  <path d="M166 306a90 90 0 0 1 180 0z" fill="#D8B36A"/>
  <rect x="96" y="300" width="320" height="10" rx="5" fill="#FFFDF8"/>
  <rect x="248" y="120" width="16" height="56" rx="8" fill="#D8B36A"/>
  <g transform="rotate(-35 256 306)">
    <rect x="248" y="120" width="16" height="56" rx="8" fill="#D8B36A" opacity=".8"/>
  </g>
  <g transform="rotate(35 256 306)">
    <rect x="248" y="120" width="16" height="56" rx="8" fill="#D8B36A" opacity=".8"/>
  </g>
`;

const ANY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2D5F5D"/>
  ${MARK}
</svg>`;

// Maskable: same mark scaled 80% about the canvas center on the full-bleed
// teal field — the whole composition stays inside the masking "safe zone".
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2D5F5D"/>
  <g transform="translate(256 256) scale(0.8) translate(-256 -256)">
  ${MARK}
  </g>
</svg>`;

const OUTPUTS = [
  { svg: ANY_SVG, size: 512, file: path.join(iconsDir, 'icon-512.png') },
  { svg: ANY_SVG, size: 192, file: path.join(iconsDir, 'icon-192.png') },
  { svg: MASKABLE_SVG, size: 512, file: path.join(iconsDir, 'icon-maskable-512.png') },
  { svg: ANY_SVG, size: 180, file: path.join(publicDir, 'apple-touch-icon.png') },
  { svg: ANY_SVG, size: 64, file: path.join(publicDir, 'favicon.png') },
];

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const { svg, size, file } of OUTPUTS) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<!doctype html><style>html,body{margin:0;padding:0}svg{display:block}</style>` +
          svg.replace('<svg ', `<svg width="${size}" height="${size}" `),
      );
      await page.screenshot({ path: file });
      console.log(`wrote ${path.relative(path.join(here, '..'), file)} (${size}x${size})`);
    }
  } finally {
    await browser.close();
  }
}

await main();
