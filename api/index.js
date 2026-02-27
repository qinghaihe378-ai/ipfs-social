import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const onlineUsers = new Map();
const offlineMessages = new Map();
const groups = new Map();
const tweets = [];
const friendRequests = new Map();
const friends = new Map();
const messages = new Map();
const users = new Set();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
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
      id: Math.floor(Math.random() * 10000000),
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
        await supabase
          .from('messages')
          .insert({
            id: message.id,
            from_user: message.from_user,
            to_user: message.to_user,
            content: message.content,
            type: message.type,
            timestamp: message.timestamp,
            read: message.read
          });
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

app.get('/api/offline-messages/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let messagesList = [];
    
    if (supabase) {
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('username', username);

      const groupIds = (userGroups || []).map(g => `group:${g.group_id}`);

      if (groupIds.length > 0) {
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .or(`to_user.eq.${username},to_user.in.(${groupIds.join(',')})`)
          .order('timestamp', { ascending: true });
        
        messagesList = (dbMessages || []).map(m => ({
          ...m,
          from: m.from_user,
          to: m.to_user
        }));
      } else {
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('to_user', username)
          .order('timestamp', { ascending: true });
        
        messagesList = (dbMessages || []).map(m => ({
          ...m,
          from: m.from_user,
          to: m.to_user
        }));
      }
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

app.post('/api/send-friend-request', async (req, res) => {
  const { from, to, message } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    if (supabase) {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', to)
        .single();

      if (userError || !targetUser) {
        return res.status(404).json({ error: '目标用户不存在' });
      }

      const request = {
        id: Date.now().toString(),
        from_user: from,
        to_user: to,
        message: message || '',
        status: 'pending',
        created_at: Date.now()
      };

      await supabase
        .from('friend_requests')
        .insert(request);

      res.json({ success: true, request });
    } else {
      res.status(404).json({ error: '数据库未配置' });
    }
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
      const { data } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user', username)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      requests = data || [];
    }

    res.json({ success: true, requests });
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
    if (supabase) {
      const { data: request } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('to_user', username)
        .single();

      if (!request) {
        return res.status(404).json({ error: '好友申请不存在' });
      }

      await supabase
        .from('friend_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (action === 'accept') {
        await supabase
          .from('friends')
          .insert([
            { user1: request.from_user, user2: request.to_user },
            { user1: request.to_user, user2: request.from_user }
          ]);
      }

      res.json({ success: true, action, request });
    } else {
      res.status(404).json({ error: '数据库未配置' });
    }
  } catch (error) {
    console.error('响应好友申请错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friends/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let friendsList = [];

    if (supabase) {
      const { data } = await supabase
        .from('friends')
        .select('*')
        .eq('user1', username);

      friendsList = (data || []).map(f => ({
        username: f.user2,
        addedAt: f.added_at
      }));
    }

    res.json({ success: true, friends: friendsList });
  } catch (error) {
    console.error('获取好友列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  const { username, publicKey, bio, avatar } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (existingUser) {
        const updateData = {};
        if (publicKey) updateData.public_key = publicKey;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('username', username)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, user: data });
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert({
            username,
            public_key: publicKey || null,
            bio: bio || null,
            avatar: avatar || null
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, user: data, isNew: true });
      }
    } else {
      res.json({ success: true, user: { username } });
    }
  } catch (error) {
    console.error('保存资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        return res.json({ success: true, user: null });
      }

      res.json({ success: true, user: data });
    } else {
      res.json({ success: true, user: { username } });
    }
  } catch (error) {
    console.error('获取资料错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-group', async (req, res) => {
  const { groupName, creator, members } = req.body;
  
  if (!groupName || !creator) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const groupId = Math.floor(Math.random() * 10000000).toString();
    const group = {
      id: groupId,
      name: groupName,
      creator,
      members: members || [creator],
      createdAt: Date.now()
    };

    if (supabase) {
      await supabase
        .from('groups')
        .insert({
          id: parseInt(groupId),
          group_id: groupId,
          name: groupName,
          creator: creator
        });

      const membersList = members || [creator];
      for (const member of membersList) {
        await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            username: member
          });
      }
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('创建群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    let groupsList = [];

    if (supabase) {
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('username', username);

      const groupIds = (memberGroups || []).map(g => g.group_id);

      if (groupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('group_id', groupIds);

        for (const group of (groupsData || [])) {
          const { data: members } = await supabase
            .from('group_members')
            .select('username')
            .eq('group_id', group.group_id);

          groupsList.push({
            id: group.group_id,
            name: group.name,
            creator: group.creator,
            members: (members || []).map(m => m.username),
            createdAt: group.created_at
          });
        }
      }
    }

    res.json({ success: true, groups: groupsList });
  } catch (error) {
    console.error('获取群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-group-message', async (req, res) => {
  const { from, groupId, content, timestamp } = req.body;
  
  if (!from || !groupId || !content) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const message = {
      id: Math.floor(Math.random() * 10000000),
      from: from,
      to: `group:${groupId}`,
      from_user: from,
      to_user: `group:${groupId}`,
      content,
      type: 'text',
      timestamp: timestamp || Date.now(),
      read: false
    };

    if (supabase) {
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          from_user: message.from_user,
          to_user: message.to_user,
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          read: message.read
        });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('发送群消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { name, username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  try {
    if (supabase) {
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (!group) {
        return res.status(404).json({ error: '群组不存在' });
      }

      if (group.creator !== username) {
        return res.status(403).json({ error: '只有群主才能修改群资料' });
      }

      if (name) {
        await supabase
          .from('groups')
          .update({ name })
          .eq('group_id', groupId);
      }

      const { data: members } = await supabase
        .from('group_members')
        .select('username')
        .eq('group_id', groupId);

      res.json({ 
        success: true, 
        group: {
          ...group,
          name: name || group.name,
          members: (members || []).map(m => m.username)
        }
      });
    } else {
      res.status(404).json({ error: '数据库未配置' });
    }
  } catch (error) {
    console.error('更新群组错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tweets', async (req, res) => {
  try {
    let tweetsList = [];

    if (supabase) {
      const { data } = await supabase
        .from('tweets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      tweetsList = data || [];
    }

    res.json({ success: true, tweets: tweetsList });
  } catch (error) {
    console.error('获取推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tweet', async (req, res) => {
  const { username, content } = req.body;
  
  if (!username || !content) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const tweet = {
      id: Date.now().toString(),
      username,
      content,
      created_at: Date.now()
    };

    if (supabase) {
      await supabase
        .from('tweets')
        .insert(tweet);
    }

    res.json({ success: true, tweet });
  } catch (error) {
    console.error('发布推文错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
