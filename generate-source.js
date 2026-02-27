import fs from 'fs';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateSourceIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 1024;
  
  const bgGradient = ctx.createLinearGradient(0, 0, size, size);
  bgGradient.addColorStop(0, '#7C3AED');
  bgGradient.addColorStop(0.5, '#9F7AEA');
  bgGradient.addColorStop(1, '#06B6D4');
  
  const radius = 220 * scale;
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
  
  const iconGradient = ctx.createLinearGradient(0, 0, size, size);
  iconGradient.addColorStop(0, '#ffffff');
  iconGradient.addColorStop(1, '#e0e7ff');
  
  ctx.fillStyle = iconGradient;
  
  ctx.beginPath();
  ctx.arc(512 * scale, 400 * scale, 80 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(320 * scale, 550 * scale, 60 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(704 * scale, 550 * scale, 60 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(512 * scale, 700 * scale, 70 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = iconGradient;
  ctx.lineWidth = 12 * scale;
  ctx.lineCap = 'round';
  
  const lines = [
    [512, 400, 320, 550],
    [512, 400, 704, 550],
    [512, 400, 512, 700],
    [320, 550, 512, 700],
    [704, 550, 512, 700],
  ];
  
  lines.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1 * scale, y1 * scale);
    ctx.lineTo(x2 * scale, y2 * scale);
    ctx.stroke();
  });
  
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(320 * scale, 550 * scale);
  ctx.lineTo(704 * scale, 550 * scale);
  ctx.stroke();
  
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = iconGradient;
  const smallNodes = [
    [416, 475], [608, 475], [416, 625], [608, 625]
  ];
  smallNodes.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(join(__dirname, 'assets/icon.png'), buffer);
  console.log('Generated source icon at assets/icon.png');
}

generateSourceIcon().catch(console.error);