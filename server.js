import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import { create } from 'ipfs-http-client';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

let ipfs;
let ipfsConnected = false;

// 尝试连接到本地 IPFS 节点
try {
  ipfs = create({
    host: 'localhost',
    port: 5001,
    protocol: 'http'
  });
  ipfsConnected = true;
  console.log('IPFS 连接成功');
} catch (error) {
  console.error('IPFS 连接失败:', error.message);
  ipfsConnected = false;
}

const onlineUsers = new Map();
const offlineMessages = new Map();
const groups = new Map();
const tweets = [];
const friendRequests = new Map();
const friends = new Map();
const messages = new Map();
const users = new Set();

console.log('服务器初始化中...');
console.log('Supabase连接状态:', supabase ? '已配置' : '未配置');
console.log('IPFS连接状态:', ipfsConnected ? '已连接' : '未连接');

app.get('/api/health', (req, res) => {
  console.log('健康检查请求:', new Date().toISOString());
  res.json({ 
    status: 'ok', 
    ipfsConnected: ipfsConnected,
    timestamp: Date.now(),
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set',
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development'
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

  // 添加到用户列表
  users.add(username);

  res.json({ success: true, username });
});

app.post('/api/check-user-online', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    let userExists = false;
    
    if (supabase) {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      userExists = !error && existingUser !== null;
    } else {
      // 在 Supabase 未配置时，使用内存中的用户列表
      userExists = users.has(username);
    }
    
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
      from: from,
      to: to,
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
          .insert({
            id: message.id,
            from_user: message.from_user,
            to_user: message.to_user,
            content: message.content,
            type: message.type,
            timestamp: message.timestamp,
            read: message.read
          })
          .select()
          .single();

        if (dbError) {
          console.warn('数据库存储失败:', dbError.message);
        }
      } catch (dbError) {
        console.warn('数据库错误:', dbError.message);
      }
    } else {
      // 使用内存存储消息
      const recipientMessages = messages.get(to) || [];
      recipientMessages.push(message);
      messages.set(to, recipientMessages);
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

  let lastFriendRequestCount = 0;
  let lastMessageCount = 0;

  const checkForUpdates = async () => {
    try {
      let newFriendRequests = [];
      let newMessages = [];

      if (supabase) {
        const { data: frData } = await supabase
          .from('friend_requests')
          .select('id')
          .eq('to', username)
          .eq('status', 'pending');
        newFriendRequests = frData || [];
      } else {
        newFriendRequests = friendRequests.get(username) || [];
      }

      if (supabase) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        newMessages = msgData || [];
      } else {
        newMessages = messages.get(username) || [];
      }

      if (newFriendRequests.length > lastFriendRequestCount) {
        const diff = newFriendRequests.length - lastFriendRequestCount;
        res.write(`data: {"type": "friend_request", "count": ${diff}}\n\n`);
        lastFriendRequestCount = newFriendRequests.length;
      }

      if (newMessages.length > lastMessageCount) {
        const diff = newMessages.length - lastMessageCount;
        res.write(`data: {"type": "new_message", "count": ${diff}}\n\n`);
        lastMessageCount = newMessages.length;
      }

      res.write('data: {"type": "ping"}\n\n');
    } catch (error) {
      console.error('检查更新错误:', error);
    }
  };

  const interval = setInterval(checkForUpdates, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/api/offline-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let messagesList = [];
    
    if (supabase) {
      // 获取用户所在的所有群组
      const { data: userGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .contains('members', [username]);

      const groupIds = (userGroups || []).map(g => `group:${g.id}`);

      // 获取私聊消息和群组消息
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_user.eq.${username},to_user.eq.${username})`)
        .or(`to_user.in.(${groupIds.join(',')})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.warn('获取离线消息失败:', error.message);
      } else {
        messagesList = (dbMessages || []).map(m => ({
          ...m,
          from: m.from_user,
          to: m.to_user
        }));
      }
    } else {
      // 从内存中获取消息
      const userMessages = [];
      
      // 查找发送给该用户的消息和该用户发送的消息
      for (const [recipient, msgs] of messages.entries()) {
        msgs.forEach(msg => {
          if (msg.to === username || msg.from === username) {
            userMessages.push(msg);
          }
        });
      }
      
      messagesList = userMessages.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    res.json({ 
      success: true, 
      messages: messagesList,
      count: messagesList.length
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

app.post('/api/send-friend-request', async (req, res) => {
  const { from, to, message } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    let userExists = true;

    // 检查目标用户是否存在
    if (supabase) {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', to)
        .single();

      if (userError || !targetUser) {
        return res.status(404).json({ error: '目标用户不存在' });
      }
    }

    const request = {
      id: Date.now().toString(),
      from,
      to,
      message: message || '',
      status: 'pending',
      createdAt: Date.now()
    };

    // 存储好友申请
    if (supabase) {
      try {
        await supabase
          .from('friend_requests')
          .insert(request);
      } catch (dbError) {
        console.warn('数据库存储好友申请失败:', dbError.message);
      }
    }

    // 存储到内存中
    const userRequests = friendRequests.get(to) || [];
    userRequests.push(request);
    friendRequests.set(to, userRequests);

    res.json({ 
      success: true, 
      request 
    });
  } catch (error) {
    console.error('发送好友申请错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friend-requests/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let requests = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to', username)
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });

      if (error) {
        console.warn('获取好友申请失败:', error.message);
      } else {
        requests = data;
      }
    } else {
      // 从内存中获取
      requests = friendRequests.get(username) || [];
      requests = requests.filter(r => r.status === 'pending');
    }

    res.json({ 
      success: true, 
      requests 
    });
  } catch (error) {
    console.error('获取好友申请错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/respond-friend-request', async (req, res) => {
  const { requestId, username, action } = req.body;
  
  if (!requestId || !username || !action || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: '缺少必要字段或参数错误' });
  }

  try {
    let request = null;

    if (supabase) {
      // 从数据库获取申请
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('to', username)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: '好友申请不存在' });
      }

      request = data;

      // 更新申请状态
      await supabase
        .from('friend_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId);
    } else {
      // 从内存中获取
      const userRequests = friendRequests.get(username) || [];
      request = userRequests.find(r => r.id === requestId);

      if (!request) {
        return res.status(404).json({ error: '好友申请不存在' });
      }

      request.status = action === 'accept' ? 'accepted' : 'rejected';
    }

    if (action === 'accept' && request) {
      // 如果接受申请，创建好友关系
      if (supabase) {
        try {
          // 为双方创建好友记录
          await supabase
            .from('friends')
            .insert([
              { user1: request.from, user2: request.to, status: 'active', createdAt: Date.now() },
              { user1: request.to, user2: request.from, status: 'active', createdAt: Date.now() }
            ]);
        } catch (dbError) {
          console.warn('创建好友关系失败:', dbError.message);
        }
      } else {
        // 使用内存存储好友关系
        const user1Friends = friends.get(request.from) || [];
        const user2Friends = friends.get(request.to) || [];
        
        user1Friends.push({
          user1: request.from,
          user2: request.to,
          status: 'active',
          createdAt: Date.now()
        });
        
        user2Friends.push({
          user1: request.to,
          user2: request.from,
          status: 'active',
          createdAt: Date.now()
        });
        
        friends.set(request.from, user1Friends);
        friends.set(request.to, user2Friends);
      }
    }

    res.json({ 
      success: true, 
      action, 
      request 
    });
  } catch (error) {
    console.error('响应好友申请错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cancel-friend-request', async (req, res) => {
  const { requestId, username } = req.body;
  
  if (!requestId || !username) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    if (supabase) {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('from', username);

      if (error) {
        console.warn('取消好友申请失败:', error.message);
      }
    } else {
      // 从内存中删除
      const userRequests = friendRequests.get(username) || [];
      const filteredRequests = userRequests.filter(r => r.id !== requestId);
      friendRequests.set(username, filteredRequests);
    }

    res.json({ 
      success: true 
    });
  } catch (error) {
    console.error('取消好友申请错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friends/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let friendsList = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user1', username)
        .eq('status', 'active');

      if (error) {
        console.warn('获取好友列表失败:', error.message);
      } else {
        friendsList = data.map(f => ({
          username: f.user2,
          addedAt: f.createdAt
        }));
      }
    } else {
      // 从内存中获取
      const userFriends = friends.get(username) || [];
      friendsList = userFriends
        .filter(f => f.status === 'active')
        .map(f => ({
          username: f.user2,
          addedAt: f.createdAt
        }));
    }

    res.json({ 
      success: true, 
      friends: friendsList
    });
  } catch (error) {
    console.error('获取好友列表错误:', error);
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

    if (supabase) {
      try {
        const { data: savedGroup, error: dbError } = await supabase
          .from('groups')
          .insert({
            id: group.id,
            name: group.name,
            creator: group.creator,
            members: group.members,
            createdAt: group.createdAt
          })
          .select()
          .single();

        if (dbError) {
          console.warn('数据库存储群组失败:', dbError.message);
        }
      } catch (dbError) {
        console.warn('数据库错误:', dbError.message);
      }
    }

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

    if (supabase) {
      try {
        await supabase
          .from('groups')
          .update({ members: group.members })
          .eq('id', groupId);
      } catch (dbError) {
        console.warn('数据库更新群组失败:', dbError.message);
      }
    }
    
    res.json({ 
      success: true, 
      group 
    });
  } catch (error) {
    console.error('加入群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let groupsList = [];

    if (supabase) {
      const { data: dbGroups, error } = await supabase
        .from('groups')
        .select('*')
        .contains('members', [username]);

      if (error) {
        console.warn('获取群组失败:', error.message);
      } else {
        groupsList = dbGroups || [];
      }
    }

    if (groupsList.length === 0) {
      groupsList = Array.from(groups.values()).filter(g => 
        g.members.includes(username)
      );
    }

    res.json({ 
      success: true, 
      groups: groupsList
    });
  } catch (error) {
    console.error('获取群组错误:', error);
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

    if (supabase) {
      try {
        const { data: savedMessage, error: dbError } = await supabase
          .from('messages')
          .insert({
            id: message.id,
            from_user: message.from,
            to_user: `group:${groupId}`,
            content: message.content,
            timestamp: message.timestamp,
            type: 'group',
            groupId: message.groupId
          })
          .select()
          .single();

        if (dbError) {
          console.warn('数据库存储群消息失败:', dbError.message);
        }
      } catch (dbError) {
        console.warn('数据库错误:', dbError.message);
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

app.get('/api/group-messages/:groupId', async (req, res) => {
  const { groupId } = req.params;
  
  try {
    let messagesList = [];
    
    if (supabase) {
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('groupId', groupId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.warn('获取群消息失败:', error.message);
      } else {
        messagesList = (dbMessages || []).map(m => ({
          ...m,
          from: m.from_user,
          to: m.to_user
        }));
      }
    }
    
    res.json({ 
      success: true, 
      messages: messagesList
    });
  } catch (error) {
    console.error('获取群消息错误:', error);
    res.status(500).json({ error: error.message });
  }
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

    let cid = null;
    if (ipfsConnected) {
      try {
        const result = await ipfs.add(JSON.stringify(tweet));
        cid = result.path;
        tweet.cid = cid;
        console.log('推文已存储到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 存储失败:', ipfsError.message);
      }
    }

    if (supabase) {
      try {
        const { data: savedTweet, error: dbError } = await supabase
          .from('tweets')
          .insert({
            id: tweet.id,
            content: tweet.content,
            author: tweet.author,
            username: tweet.username,
            timestamp: tweet.timestamp,
            cid: cid
          })
          .select()
          .single();

        if (dbError) {
          console.warn('数据库存储推文失败:', dbError.message);
        }
      } catch (dbError) {
        console.warn('数据库错误:', dbError.message);
      }
    }

    tweets.unshift(tweet);

    res.json({ 
      success: true, 
      tweet, 
      cid 
    });
  } catch (error) {
    console.error('发布推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tweets', async (req, res) => {
  try {
    let tweetsList = [];

    if (supabase) {
      const { data: dbTweets, error } = await supabase
        .from('tweets')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('获取推文失败:', error.message);
      } else {
        tweetsList = dbTweets || [];
      }
    }

    if (tweetsList.length === 0) {
      tweetsList = tweets;
    }

    res.json({ tweets: tweetsList });
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
      nickname: username,
      bio: bio || '欢迎使用 Mutual',
      avatar: avatar || '',
      publicKey: publicKey,
      createdAt: Date.now()
    };

    let cid = null;
    if (ipfsConnected) {
      try {
        const result = await ipfs.add(JSON.stringify(profile));
        cid = result.path;
        console.log('用户资料已存储到 IPFS:', cid);
      } catch (ipfsError) {
        console.warn('IPFS 存储失败:', ipfsError.message);
        cid = `ipfs-user-${username}-${Date.now()}`;
      }
    } else {
      cid = `ipfs-user-${username}-${Date.now()}`;
    }

    if (supabase) {
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
        cid,
        profile: user 
      });
    } else {
      // 如果没有 Supabase，添加到内存用户列表
      users.add(username);
      res.json({ 
        success: true, 
        cid,
        profile 
      });
    }
  } catch (error) {
    console.error('创建资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (supabase) {
      let query = supabase.from('users').select('*');
      
      if (username) {
        query = query.eq('username', username);
      }
      
      const { data: users, error } = await query;

      if (error) {
        throw error;
      }

      res.json({ success: true, users });
    } else {
      // 如果没有 Supabase，返回内存中的用户信息
      const userList = Array.from(users);
      const filteredUsers = username ? userList.filter(u => u === username).map(u => ({ username: u })) : userList.map(u => ({ username: u }));
      res.json({ success: true, users: filteredUsers });
    }
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log('API服务已就绪');
});