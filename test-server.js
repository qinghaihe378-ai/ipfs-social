import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`测试服务器运行在 http://0.0.0.0:${PORT}`);
  console.log('API服务已就绪');
});
