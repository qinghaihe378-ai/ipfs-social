import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconSizes = [
  { name: 'mipmap-ldpi/ic_launcher.png', size: 36 },
  { name: 'mipmap-ldpi/ic_launcher_round.png', size: 36 },
  { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { name: 'mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
];

const foregroundSizes = [
  { name: 'mipmap-ldpi/ic_launcher_foreground.png', size: 108 },
  { name: 'mipmap-mdpi/ic_launcher_foreground.png', size: 108 },
  { name: 'mipmap-hdpi/ic_launcher_foreground.png', size: 162 },
  { name: 'mipmap-xhdpi/ic_launcher_foreground.png', size: 216 },
  { name: 'mipmap-xxhdpi/ic_launcher_foreground.png', size: 324 },
  { name: 'mipmap-xxxhdpi/ic_launcher_foreground.png', size: 432 },
];

const backgroundSizes = [
  { name: 'mipmap-ldpi/ic_launcher_background.png', size: 36 },
  { name: 'mipmap-mdpi/ic_launcher_background.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher_background.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher_background.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher_background.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher_background.png', size: 192 },
];

async function generateIcons() {
  const imagePath = join(__dirname, 'assets/icon.jpg');
  const img = await loadImage(imagePath);
  
  const baseDir = join(__dirname, 'android/app/src/main/res');
  
  for (const { name, size } of iconSizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const scale = Math.max(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;
    
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    const dir = join(baseDir, name.split('/')[0]);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(join(baseDir, name), buffer);
    console.log(`Generated: ${name} (${size}x${size})`);
  }
  
  for (const { name, size } of foregroundSizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const scale = Math.max(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;
    
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    const dir = join(baseDir, name.split('/')[0]);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(join(baseDir, name), buffer);
    console.log(`Generated: ${name} (${size}x${size})`);
  }
  
  for (const { name, size } of backgroundSizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    const dir = join(baseDir, name.split('/')[0]);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(join(baseDir, name), buffer);
    console.log(`Generated background: ${name}`);
  }
  
  const sourceCanvas = createCanvas(1024, 1024);
  const sourceCtx = sourceCanvas.getContext('2d');
  const scale = Math.max(1024 / img.width, 1024 / img.height);
  const x = (1024 - img.width * scale) / 2;
  const y = (1024 - img.height * scale) / 2;
  sourceCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
  const sourceBuffer = sourceCanvas.toBuffer('image/png');
  fs.writeFileSync(join(__dirname, 'assets/icon.png'), sourceBuffer);
  console.log('Generated source icon at assets/icon.png');
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);