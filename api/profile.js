import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase 未配置' });
  }

  if (req.method === 'POST') {
    const { username, bio, avatar, publicKey } = req.body;

    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }

    try {
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
          public_key: publicKey || ''
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      res.json({
        success: true,
        user,
        cid: `ipfs-user-${username}-${Date.now()}`
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
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
  }
}
