import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { create } from 'ipfs-http-client';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

let ipfs;
const onlineUsers = new Map();
const offlineMessages = new Map();
const groups = new Map();
const tweets = [];

async function initIPFS() {
  try {
    ipfs = await create({ 
      url: process.env.IPFS_URL || 'http://localhost:5001/api/v0',
      timeout: 5000
    });
    console.log('IPFS 节点已连接');
    
    try {
      const id = await ipfs.id();
      console.log('节点 ID:', id.id);
    } catch (idError) {
      console.warn('无法获取节点 ID，但连接已建立:', idError.message);
    }
  } catch (error) {
    console.warn('连接 IPFS 失败 (非关键):', error.message);
    ipfs = null;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ipfsConnected: !!ipfs,
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set'
    }
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
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  onlineUsers.set(username, {
    publicKey,
    lastSeen: Date.now(),
    online: true
  });

  res.json({ success: true, username });
});

app.post('/api/check-user-online', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    if (!supabase) {
      return res.json({ 
        online: false, 
        exists: false,
        username,
        lastSeen: null
      });
    }
    
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    const userExists = !error && existingUser !== null;
    
    const user = onlineUsers.get(username);
    const isOnline = user && (Date.now() - user.lastSeen) < 60000;

    res.json({ 
      online: isOnline, 
      exists: userExists,
      username,
      lastSeen: user?.lastSeen || null
    });
  } catch (error) {
    console.error('检查用户状态错误:', error);
    res.json({ 
      online: false, 
      exists: false,
      username,
      lastSeen: null
    });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { from, to, content, timestamp } = req.body;
    
    if (!from || !to || !content) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const message = {
      id: Date.now().toString(),
      from_user: from,
      to_user: to,
      content,
      type: 'text',
      timestamp: timestamp || Date.now(),
      read: false
    };

    if (supabase) {
      try {
        const { data: savedMessage, error: dbError } = await supabase
          .from('messages')
          .insert(message)
          .select()
          .single();

        if (dbError) {
          console.warn('数据库存储失败:', dbError.message);
        }
      } catch (dbError) {
        console.warn('数据库错误:', dbError.message);
      }
    }

    const recipient = onlineUsers.get(to);
    const isOnline = recipient && (Date.now() - recipient.lastSeen) < 60000;

    res.json({ 
      success: true, 
      message,
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
});

app.get('/api/offline-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    if (!supabase) {
      return res.json({ 
        success: true, 
        messages: [],
        count: 0
      });
    }
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user.eq.${username},to_user.eq.${username})`)
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('获取离线消息失败:', error.message);
      return res.json({ 
        success: true, 
        messages: [],
        count: 0
      });
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

    res.json({ 
      success: true, 
      message
    });
  } catch (error) {
    console.error('上传文件错误:', error);
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

    tweets.unshift(tweet);

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
  res.json({ tweets });
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

    let cid = null;
    if (ipfs) {
      try {
        const userData = JSON.stringify(user);
        const result = await ipfs.add(userData);
        cid = result.cid.toString();
        console.log('用户资料已上传到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 上传失败:', ipfsError.message);
        cid = `ipfs-user-${username}-${Date.now()}`;
      }
    } else {
      cid = `ipfs-user-${username}-${Date.now()}`;
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscribe', async (req, res) => {
  const { topic = 'social-tweets' } = req.query;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
});

initIPFS().finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  });
});