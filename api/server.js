import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set'
    }
  });
});

app.post('/api/check-username', (req, res) => {
  const { username } = req.body;
  res.json({ exists: false, username });
});

app.post('/api/profile', (req, res) => {
  const { username, bio, avatar, publicKey } = req.body;
  
  if (!username || !publicKey) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  // 模拟成功响应
  res.json({ 
    success: true, 
    cid: `ipfs-user-${username}-${Date.now()}`,
    profile: {
      id: Date.now().toString(),
      username,
      nickname: username,
      bio: bio || '欢迎使用 Mutual',
      avatar: avatar || '',
      public_key: publicKey,
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/user-online', (req, res) => {
  const { username, publicKey } = req.body;
  res.json({ success: true, message: '用户上线成功' });
});

app.get('/api/offline-messages/:username', (req, res) => {
  const { username } = req.params;
  res.json([]);
});

app.get('/api/subscribe-messages/:username', (req, res) => {
  const { username } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: {"type": "connected"}\n\n');
});

app.post('/api/tweet', (req, res) => {
  const { content, author, username, timestamp } = req.body;
  res.json({ 
    success: true, 
    tweet: {
      id: Date.now().toString(),
      content,
      author,
      username,
      timestamp: timestamp || Date.now()
    }
  });
});

app.get('/api/tweets', (req, res) => {
  res.json({ tweets: [] });
});

app.post('/api/send-message', (req, res) => {
  const { from, to, content, timestamp } = req.body;
  res.json({ 
    success: true, 
    message: {
      id: Date.now().toString(),
      from,
      to,
      content,
      timestamp: timestamp || Date.now()
    }
  });
});

export default app;
