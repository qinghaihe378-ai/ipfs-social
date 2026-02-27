import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import { NFTStorage } from 'nft.storage';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const nftStorageToken = process.env.NFT_STORAGE_API_KEY || '';
const nftstorage = nftStorageToken ? new NFTStorage({ token: nftStorageToken }) : null;

const onlineUsers = new Map();
const offlineMessages = new Map();
const groups = new Map();

console.log('API服务器初始化中...');
console.log('Supabase连接状态:', supabase ? '已配置' : '未配置');
console.log('IPFS功能:', nftstorage ? '已启用 (NFT.Storage)' : '未配置');


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ipfsConnected: !!nftstorage,
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set',
      nftStorageApiKey: process.env.NFT_STORAGE_API_KEY ? 'set' : 'not set'
    }
  });
});

app.get('/api/env-test', (req, res) => {
  res.json({ 
    status: 'ok',
    env: {
      NFT_STORAGE_API_KEY: process.env.NFT_STORAGE_API_KEY ? 'exists' : 'not exists',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'exists' : 'not exists',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'exists' : 'not exists',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set'
    },
    nftstorage: !!nftstorage,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    if (!supabase) {
      return res.json({ exists: false, username });
    }
    
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    const exists = !error && existingUser !== null;
    res.json({ exists, username });
  } catch (error) {
    console.error('检查用户名错误:', error);
    res.json({ exists: false, username });
  }
});

app.post('/api/user-online', async (req, res) => {
  const { username, publicKey } = req.body;
  
  if (!username || !publicKey) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    onlineUsers.set(username, {
      publicKey,
      lastSeen: Date.now(),
      connectedAt: Date.now()
    });

    res.json({ 
      success: true, 
      message: '用户上线成功',
      onlineUsers: Array.from(onlineUsers.keys())
    });
  } catch (error) {
    console.error('用户上线错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/offline-messages/:username', (req, res) => {
  const { username } = req.params;
  
  try {
    const messages = offlineMessages.get(username) || [];
    offlineMessages.delete(username);
    res.json(messages);
  } catch (error) {
    console.error('获取离线消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscribe-messages/:username', (req, res) => {
  const { username } = req.params;
  
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write('data: {"type": "connected"}\n\n');

    const interval = setInterval(() => {
      try {
        res.write('data: {"type": "ping"}\n\n');
      } catch (error) {
        clearInterval(interval);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    console.error('订阅消息错误:', error);
    res.status(500).end();
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase 未配置' });
    }
    
    const { username, bio, avatar, publicKey } = req.body;
    
    if (!username || !publicKey) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      return res.status(400).json({ success: false, code: 'USERNAME_EXISTS', error: '用户名已存在' });
    }

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        nickname: username,
        bio: bio || '欢迎使用 Mutual',
        avatar: avatar || '',
        public_key: publicKey
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    let cid = `ipfs-user-${username}-${Date.now()}`;
    
    if (nftstorage) {
      try {
        const userData = JSON.stringify(user);
        const blob = new Blob([userData], { type: 'application/json' });
        const cidResult = await nftstorage.storeBlob(blob);
        cid = cidResult;
        console.log('用户资料已上传到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 上传失败:', ipfsError.message);
        cid = `ipfs-user-${username}-${Date.now()}`;
      }
    }

    res.json({ 
      success: true, 
      cid,
      profile: user 
    });
  } catch (error) {
    console.error('创建资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase 未配置' });
    }
    
    const { username } = req.query;
    
    let query = supabase.from('users').select('*');
    
    if (username) {
      query = query.eq('username', username);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json(users);
  } catch (error) {
    console.error('获取资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tweet', async (req, res) => {
  try {
    const { content, author, username, timestamp } = req.body;
    
    if (!content || !author || !username) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const tweet = {
      content,
      author,
      username,
      timestamp: timestamp || Date.now(),
      id: Date.now().toString()
    };

    if (nftstorage) {
      try {
        const tweetJSON = JSON.stringify(tweet);
        const blob = new Blob([tweetJSON], { type: 'application/json' });
        const cid = await nftstorage.storeBlob(blob);
        console.log('推文已上传到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 上传失败:', ipfsError.message);
      }
    }

    res.json({ 
      success: true, 
      tweet 
    });
  } catch (error) {
    console.error('发布推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tweets', (req, res) => {
  res.json({ tweets: [] });
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { from, to, content, timestamp } = req.body;
    
    if (!from || !to || !content) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const message = {
      id: Date.now().toString(),
      from,
      to,
      content,
      timestamp: timestamp || Date.now()
    };

    if (onlineUsers.has(to)) {
      // 用户在线，可以通过实时连接发送
      console.log('用户在线，发送实时消息:', message);
    } else {
      // 用户离线，存储为离线消息
      const userMessages = offlineMessages.get(to) || [];
      userMessages.push(message);
      offlineMessages.set(to, userMessages);
      console.log('用户离线，存储离线消息:', message);
    }

    if (nftstorage) {
      try {
        const messageJSON = JSON.stringify(message);
        const blob = new Blob([messageJSON], { type: 'application/json' });
        const cid = await nftstorage.storeBlob(blob);
        console.log('消息已上传到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 上传失败:', ipfsError.message);
      }
    }

    res.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
