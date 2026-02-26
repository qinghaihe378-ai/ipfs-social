const users = new Map();
const messages = new Map();
const groups = new Map();
const onlineUsers = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { username, bio, avatar, publicKey } = req.body;

    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }

    const user = {
      username,
      bio: bio || '',
      avatar: avatar || '',
      publicKey: publicKey || '',
      createdAt: Date.now()
    };

    users.set(username, user);

    res.json({
      success: true,
      user,
      cid: `ipfs-user-${username}-${Date.now()}`
    });
  } else {
    res.json({
      success: true,
      users: Array.from(users.values())
    });
  }
}

export { users, messages, groups, onlineUsers };
