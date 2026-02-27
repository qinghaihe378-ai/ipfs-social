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
  bgGradient.addColorStop(0, '#0F172A');
  bgGradient.addColorStop(0.5, '#1E293B');
  bgGradient.addColorStop(1, '#334155');
  
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
  
  const cx = 512 * scale;
  const cy = 512 * scale;
  
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
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(join(__dirname, 'assets/icon.png'), buffer);
  console.log('Generated Web3 crypto theme icon at assets/icon.png');
}

generateSourceIcon().catch(console.error);