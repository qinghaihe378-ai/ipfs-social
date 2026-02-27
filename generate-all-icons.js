import fs from 'fs';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
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

function drawIcon(ctx, size, isRound = false, isForeground = false) {
  const scale = size / 1024;
  
  if (!isForeground) {
    const bgGradient = ctx.createLinearGradient(0, 0, size, size);
    bgGradient.addColorStop(0, '#0F172A');
    bgGradient.addColorStop(0.5, '#1E293B');
    bgGradient.addColorStop(1, '#334155');
    
    const radius = isRound ? size / 2 : 220 * scale;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = bgGradient;
    ctx.fill();
  } else {
    ctx.clearRect(0, 0, size, size);
  }
  
  const cx = 512 * scale;
  const cy = 512 * scale;
  
  if (!isForeground) {
    const outerGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200 * scale);
    outerGradient.addColorStop(0, '#6366F1');
    outerGradient.addColorStop(1, '#8B5CF6');
    
    ctx.strokeStyle = outerGradient;
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, 180 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, 140 * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  const gradient = ctx.createLinearGradient(cx - 80 * scale, cy - 80 * scale, cx + 80 * scale, cy + 80 * scale);
  gradient.addColorStop(0, '#FCD34D');
  gradient.addColorStop(0.5, '#F59E0B');
  gradient.addColorStop(1, '#D97706');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 75 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(cx, cy, 60 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FCD34D';
  ctx.beginPath();
  ctx.arc(cx, cy, 45 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  const nodeGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 * scale);
  nodeGradient.addColorStop(0, '#A78BFA');
  nodeGradient.addColorStop(1, '#6366F1');
  
  ctx.fillStyle = nodeGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  if (!isForeground) {
    const connectNodes = [
      [512, 250], [512, 774], [250, 512], [774, 512],
      [325, 325], [699, 325], [325, 699], [699, 699]
    ];
    
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    
    connectNodes.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x * scale, y * scale);
      ctx.stroke();
    });
    
    const smallNodeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15 * scale);
    smallNodeGradient.addColorStop(0, '#C4B5FD');
    smallNodeGradient.addColorStop(1, '#818CF8');
    
    connectNodes.forEach(([x, y]) => {
      ctx.fillStyle = smallNodeGradient;
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, 14 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

async function generateAllIcons() {
  const baseDir = join(__dirname, 'android/app/src/main/res');
  
  for (const { name, size, isRound } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    drawIcon(ctx, size, isRound, false);
    
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
    
    drawIcon(ctx, size, false, true);
    
    const dir = join(baseDir, name.split('/')[0]);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(join(baseDir, name), buffer);
    console.log(`Generated: ${name} (${size}x${size})`);
  }
  
  const sourceCanvas = createCanvas(1024, 1024);
  const sourceCtx = sourceCanvas.getContext('2d');
  drawIcon(sourceCtx, 1024, false, false);
  const sourceBuffer = sourceCanvas.toBuffer('image/png');
  fs.writeFileSync(join(__dirname, 'assets/icon.png'), sourceBuffer);
  console.log('Generated source icon at assets/icon.png');
  
  console.log('All icons generated successfully!');
}

generateAllIcons().catch(console.error);