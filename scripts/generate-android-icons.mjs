/**
 * Generates Android mipmap launcher icons from a source image.
 * Prefers resources/android-icon/neurotrain-app-icon.png if present;
 * otherwise uses resources/android-icon/neurotrain-app-icon.svg.
 *
 * Foreground layers: transparent canvas, artwork scaled to ~72% max edge (adaptive safe zone).
 * Legacy ic_launcher / ic_launcher_round: #FFFFFF background (matches ic_launcher_background).
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
const iconDir = path.join(root, 'resources', 'android-icon');

const PNG_SRC = path.join(iconDir, 'neurotrain-app-icon.png');
const SVG_SRC = path.join(iconDir, 'neurotrain-app-icon.svg');

const BG = { r: 255, g: 255, b: 255, alpha: 1 };
/** Max fraction of canvas edge for artwork (Android adaptive ~66dp safe zone in 108dp). */
const SAFE_SCALE = 0.72;

const FOREGROUND_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const LEGACY_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

function loadSource() {
  if (existsSync(PNG_SRC)) {
    console.log('Using source:', path.relative(root, PNG_SRC));
    return sharp(PNG_SRC).ensureAlpha();
  }
  if (existsSync(SVG_SRC)) {
    console.log('Using source:', path.relative(root, SVG_SRC));
    return sharp(SVG_SRC).ensureAlpha();
  }
  throw new Error(
    `No icon source found. Add either:\n  ${PNG_SRC}\n  ${SVG_SRC}`
  );
}

async function centeredContainPipeline(input, canvasSize, background) {
  const maxEdge = Math.round(canvasSize * SAFE_SCALE);
  const resizedBuf = await input
    .clone()
    .resize(maxEdge, maxEdge, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(resizedBuf).metadata();
  const w = meta.width ?? maxEdge;
  const h = meta.height ?? maxEdge;
  const left = Math.round((canvasSize - w) / 2);
  const top = Math.round((canvasSize - h) / 2);

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resizedBuf, left, top }])
    .png();
}

async function writeForeground(baseInput, density, size) {
  const out = path.join(resDir, `mipmap-${density}`, 'ic_launcher_foreground.png');
  const pipeline = await centeredContainPipeline(baseInput, size, {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
  });
  await pipeline.toFile(out);
  console.log('Wrote', path.relative(root, out));
}

async function writeLegacy(baseInput, density, size, name) {
  const out = path.join(resDir, `mipmap-${density}`, `${name}.png`);
  const pipeline = await centeredContainPipeline(baseInput, size, BG);
  await pipeline.toFile(out);
  console.log('Wrote', path.relative(root, out));
}

async function main() {
  const input = loadSource();
  for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
    await writeForeground(input, density, size);
  }
  for (const [density, size] of Object.entries(LEGACY_SIZES)) {
    await writeLegacy(input, density, size, 'ic_launcher');
    await writeLegacy(input, density, size, 'ic_launcher_round');
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
