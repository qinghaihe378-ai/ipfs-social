import { users, messages, onlineUsers } from './profile.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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

    if (!messages.has(to)) {
      messages.set(to, []);
    }
    messages.get(to).push(message);

    if (!messages.has(from)) {
      messages.set(from, []);
    }
    messages.get(from).push(message);

    res.json({
      success: true,
      message,
      delivered: true
    });
  } else {
    const { username } = req.query;
    if (username) {
      const userMessages = messages.get(username) || [];
      res.json({
        success: true,
        messages: userMessages
      });
    } else {
      res.json({
        success: true,
        messages: []
      });
    }
  }
}
