import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { create } from 'ipfs-http-client';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

let ipfs;
const registeredUsers = new Set();
const onlineUsers = new Map();
const offlineMessages = new Map();
const groups = new Map();

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
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ipfsConnected: !!ipfs });
});

app.post('/api/check-username', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  const exists = registeredUsers.has(username);
  res.json({ exists, username });
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

  try {
    await ipfs.pubsub.publish('user-presence', JSON.stringify({
      type: 'online',
      username,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('广播在线状态失败:', error.message);
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
      id: Date.now().toString(),
      from,
      to,
      content,
      timestamp: timestamp || Date.now(),
      read: false
    };

    const recipient = onlineUsers.get(to);
    const isOnline = recipient && (Date.now() - recipient.lastSeen) < 60000;

    if (isOnline) {
      const topic = `chat-${to}`;
      await ipfs.pubsub.publish(topic, JSON.stringify(message));
    } else {
      if (!offlineMessages.has(to)) {
        offlineMessages.set(to, []);
      }
      offlineMessages.get(to).push(message);
      
      const messageJSON = JSON.stringify(message);
      const { cid } = await ipfs.add(messageJSON);
      message.cid = cid.toString();
    }

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

  const topic = `chat-${username}`;
  
  try {
    await ipfs.pubsub.subscribe(topic, (msg) => {
      const message = JSON.parse(msg.data.toString());
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    });

    req.on('close', () => {
      ipfs.pubsub.unsubscribe(topic);
    });
  } catch (error) {
    console.error('订阅消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/offline-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const messages = offlineMessages.get(username) || [];
    offlineMessages.delete(username);
    
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

    const groupJSON = JSON.stringify(group);
    const { cid } = await ipfs.add(groupJSON);
    group.cid = cid.toString();

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

    for (const member of group.members) {
      if (member !== from) {
        const topic = `chat-${member}`;
        await ipfs.pubsub.publish(topic, JSON.stringify(message));
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

    const fileBuffer = Buffer.from(fileData, 'base64');
    const { cid } = await ipfs.add(fileBuffer);

    const message = {
      id: Date.now().toString(),
      from,
      to,
      type: 'file',
      fileName,
      fileType,
      fileSize: fileBuffer.length,
      cid: cid.toString(),
      timestamp: Date.now()
    };

    const recipient = onlineUsers.get(to);
    const isOnline = recipient && (Date.now() - recipient.lastSeen) < 60000;

    if (isOnline) {
      const topic = `chat-${to}`;
      await ipfs.pubsub.publish(topic, JSON.stringify(message));
    } else {
      if (!offlineMessages.has(to)) {
        offlineMessages.set(to, []);
      }
      offlineMessages.get(to).push(message);
    }

    res.json({ 
      success: true, 
      message,
      cid: cid.toString()
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download-file/:cid', async (req, res) => {
  const { cid } = req.params;
  
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

    const tweetJSON = JSON.stringify(tweet);
    const { cid } = await ipfs.add(tweetJSON);
    
    try {
      const topic = 'social-tweets';
      await ipfs.pubsub.publish(topic, Buffer.from(tweetJSON));
      console.log('推文已通过 PubSub 广播');
    } catch (pubsubError) {
      console.warn('PubSub 广播失败，但推文已存储到 IPFS:', pubsubError.message);
    }

    res.json({ 
      success: true, 
      cid: cid.toString(),
      tweet 
    });
  } catch (error) {
    console.error('发布推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tweet/:cid', async (req, res) => {
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

    const profile = {
      username,
      bio: bio || '',
      avatar: avatar || '',
      publicKey,
      timestamp: Date.now()
    };

    const profileJSON = JSON.stringify(profile);
    const { cid } = await ipfs.add(profileJSON);

    registeredUsers.add(username);

    res.json({ 
      success: true, 
      cid: cid.toString(),
      profile 
    });
  } catch (error) {
    console.error('创建资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile/:cid', async (req, res) => {
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

  try {
    await ipfs.pubsub.subscribe(topic, (msg) => {
      const tweet = JSON.parse(msg.data.toString());
      res.write(`data: ${JSON.stringify(tweet)}\n\n`);
    });

    res.on('close', async () => {
      await ipfs.pubsub.unsubscribe(topic);
    });
  } catch (error) {
    console.error('订阅错误:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
});

initIPFS().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
});
