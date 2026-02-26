import { groups } from './profile.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { groupName, creator, members } = req.body;

    if (!groupName || !creator) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

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
      group,
      cid: `ipfs-group-${groupId}`
    });
  } else {
    res.json({
      success: true,
      groups: Array.from(groups.values())
    });
  }
}
