import fs from 'fs';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bgSizes = [
  { name: 'mipmap-ldpi/ic_launcher_background.png', size: 36 },
  { name: 'mipmap-mdpi/ic_launcher_background.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher_background.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher_background.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher_background.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher_background.png', size: 192 },
];

function createBackgroundIcon(ctx, size) {
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, size, size);
}

const baseDir = join(__dirname, 'android/app/src/main/res');
for (const { name, size } of bgSizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  createBackgroundIcon(ctx, size);
  
  const dir = join(baseDir, name.split('/')[0]);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(join(baseDir, name), buffer);
  console.log(`Generated background: ${name}`);
}
console.log('All background icons generated!');