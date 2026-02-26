import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { create } from 'ipfs-http-client';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let ipfs;
const onlineUsers = new Map();
const offlineMessages = new Map();

async function initIPFS() {
  try {
    ipfs = await create({ 
      url: 'http://localhost:5001/api/v0',
      timeout: 30000
    });
    console.log('IPFS 节点已连接');
    
    try {
      const id = await ipfs.id();
      console.log('节点 ID:', id.id);
    } catch (idError) {
      console.warn('无法获取节点 ID，但连接已建立:', idError.message);
    }
  } catch (error) {
    console.error('连接 IPFS 失败:', error.message);
    console.log('提示: 请确保 IPFS 节点正在运行 (ipfs daemon)');
    console.log('服务器将继续运行，但部分功能可能不可用');
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ipfsConnected: !!ipfs });
});

app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
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
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  onlineUsers.set(username, {
    publicKey,
    lastSeen: Date.now(),
    online: true
  });

  if (ipfs) {
    try {
      await ipfs.pubsub.publish('user-presence', JSON.stringify({
        type: 'online',
        username,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('广播在线状态失败:', error.message);
    }
  }

  res.json({ success: true, username });
});

app.post('/api/check-user-online', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  const user = onlineUsers.get(username);
  const isOnline = user && (Date.now() - user.lastSeen) < 60000;

  res.json({ 
    online: isOnline, 
    username,
    lastSeen: user?.lastSeen || null
  });
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { from, to, content, timestamp } = req.body;
    
    if (!from || !to || !content) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const message = {
      from_user: from,
      to_user: to,
      content,
      type: 'text',
      timestamp: timestamp || Date.now(),
      read: false
    };

    const { data: savedMessage, error: dbError } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    const recipient = onlineUsers.get(to);
    const isOnline = recipient && (Date.now() - recipient.lastSeen) < 60000;

    if (ipfs && isOnline) {
      try {
        const topic = `chat-${to}`;
        await ipfs.pubsub.publish(topic, JSON.stringify(savedMessage));
      } catch (error) {
        console.warn('发送消息失败:', error.message);
      }
    }

    res.json({ 
      success: true, 
      message: savedMessage,
      delivered: isOnline
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscribe-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const topic = `chat-${username}`;
  
  if (ipfs) {
    try {
      await ipfs.pubsub.subscribe(topic, (msg) => {
        const message = JSON.parse(msg.data.toString());
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      });

      req.on('close', () => {
        if (ipfs) {
          ipfs.pubsub.unsubscribe(topic);
        }
      });
    } catch (error) {
      console.error('订阅消息错误:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(503).json({ error: 'IPFS 未连接' });
  }
});

app.get('/api/offline-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user.eq.${username},to_user.eq.${username})`)
      .order('timestamp', { ascending: true });

    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('获取离线消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mark-read', async (req, res) => {
  const { messageIds, username } = req.body;
  
  try {
    const messages = offlineMessages.get(username) || [];
    messageIds.forEach(id => {
      const msg = messages.find(m => m.id === id);
      if (msg) {
        msg.read = true;
      }
    });
    
    res.json({ success: true, markedCount: messageIds.length });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-group', async (req, res) => {
  const { groupName, creator, members } = req.body;
  
  if (!groupName || !creator) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const groupId = Date.now().toString();
    const group = {
      id: groupId,
      name: groupName,
      creator,
      members: members || [creator],
      createdAt: Date.now()
    };

    groups.set(groupId, group);

    res.json({ 
      success: true, 
      group 
    });
  } catch (error) {
    console.error('创建群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/join-group', async (req, res) => {
  const { groupId, username } = req.body;
  
  if (!groupId || !username) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const group = groups.get(groupId);
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }

    if (group.members.includes(username)) {
      return res.status(400).json({ error: '已在群组中' });
    }

    group.members.push(username);
    
    res.json({ 
      success: true, 
      group 
    });
  } catch (error) {
    console.error('加入群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-group-message', async (req, res) => {
  try {
    const { from, groupId, content, timestamp } = req.body;
    
    if (!from || !groupId || !content) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const group = groups.get(groupId);
    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }

    const message = {
      id: Date.now().toString(),
      from,
      groupId,
      groupName: group.name,
      content,
      timestamp: timestamp || Date.now(),
      type: 'group'
    };

    if (ipfs) {
      for (const member of group.members) {
        if (member !== from) {
          try {
            const topic = `chat-${member}`;
            await ipfs.pubsub.publish(topic, JSON.stringify(message));
          } catch (error) {
            console.warn('发送群消息失败:', error.message);
          }
        }
      }
    }

    res.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('发送群消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:username', (req, res) => {
  const { username } = req.params;
  
  const userGroups = Array.from(groups.values()).filter(
    group => group.members.includes(username)
  );

  res.json({ 
    success: true, 
    groups: userGroups 
  });
});

app.post('/api/upload-file', async (req, res) => {
  try {
    const { fileData, fileName, fileType, from, to } = req.body;
    
    if (!fileData || !fileName || !from || !to) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const message = {
      id: Date.now().toString(),
      from,
      to,
      type: 'file',
      fileName,
      fileType,
      fileSize: Buffer.from(fileData, 'base64').length,
      timestamp: Date.now()
    };

    const recipient = onlineUsers.get(to);
    const isOnline = recipient && (Date.now() - recipient.lastSeen) < 60000;

    if (ipfs && isOnline) {
      try {
        const topic = `chat-${to}`;
        await ipfs.pubsub.publish(topic, JSON.stringify(message));
      } catch (error) {
        console.warn('发送文件消息失败:', error.message);
      }
    } else {
      if (!offlineMessages.has(to)) {
        offlineMessages.set(to, []);
      }
      offlineMessages.get(to).push(message);
    }

    res.json({ 
      success: true, 
      message
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download-file/:cid', async (req, res) => {
  const { cid } = req.params;
  
  if (!ipfs) {
    return res.status(503).json({ error: 'IPFS 未连接' });
  }

  try {
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const fileBuffer = Buffer.concat(chunks);
    const base64 = fileBuffer.toString('base64');
    
    res.json({ 
      success: true, 
      fileData: base64,
      size: fileBuffer.length
    });
  } catch (error) {
    console.error('下载文件错误:', error);
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

    if (ipfs) {
      try {
        const tweetJSON = JSON.stringify(tweet);
        const topic = 'social-tweets';
        await ipfs.pubsub.publish(topic, Buffer.from(tweetJSON));
        console.log('推文已通过 PubSub 广播');
      } catch (pubsubError) {
        console.warn('PubSub 广播失败:', pubsubError.message);
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

app.get('/api/tweet/:cid', async (req, res) => {
  if (!ipfs) {
    return res.status(503).json({ error: 'IPFS 未连接' });
  }

  try {
    const { cid } = req.params;
    const chunks = [];
    
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const tweet = JSON.parse(Buffer.concat(chunks).toString());
    res.json({ success: true, tweet });
  } catch (error) {
    console.error('获取推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
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

    res.json({ 
      success: true, 
      cid: `ipfs-user-${username}-${Date.now()}`,
      profile: user 
    });
  } catch (error) {
    console.error('创建资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const { username } = req.query;
    
    let query = supabase.from('users').select('*');
    
    // 如果提供了用户名，只查询该用户
    if (username) {
      query = query.eq('username', username);
    }
    
    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      users: username ? (users.length > 0 ? [users[0]] : []) : users
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/profile/:cid', async (req, res) => {
  if (!ipfs) {
    return res.status(503).json({ error: 'IPFS 未连接' });
  }

  try {
    const { cid } = req.params;
    const chunks = [];
    
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const profile = JSON.parse(Buffer.concat(chunks).toString());
    res.json({ success: true, profile });
  } catch (error) {
    console.error('获取资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscribe', async (req, res) => {
  const { topic = 'social-tweets' } = req.query;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (ipfs) {
    try {
      await ipfs.pubsub.subscribe(topic, (msg) => {
        const tweet = JSON.parse(msg.data.toString());
        res.write(`data: ${JSON.stringify(tweet)}\n\n`);
      });

      res.on('close', async () => {
        if (ipfs) {
          await ipfs.pubsub.unsubscribe(topic);
        }
      });
    } catch (error) {
      console.error('订阅错误:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  } else {
    res.status(503).json({ error: 'IPFS 未连接' });
  }
});

// 启动服务器
initIPFS().finally(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
});
