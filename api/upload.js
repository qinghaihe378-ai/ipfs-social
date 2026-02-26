import { messages } from './profile.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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
      fileSize: fileData.length,
      cid: `ipfs-file-${Date.now()}`,
      timestamp: Date.now()
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
      cid: message.cid
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
