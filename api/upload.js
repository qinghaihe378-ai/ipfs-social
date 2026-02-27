import { NFTStorage, File } from 'nft.storage';
import { messages } from './profile.js';

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_API_KEY;

async function uploadToNFTStorage(fileData, fileName, fileType) {
  if (!NFT_STORAGE_KEY) {
    console.warn('NFT_STORAGE_API_KEY 未配置，使用模拟 CID');
    return `ipfs-file-${Date.now()}`;
  }

  try {
    const client = new NFTStorage({ token: NFT_STORAGE_KEY });
    
    const buffer = Buffer.from(fileData, 'base64');
    
    const file = new File([buffer], fileName, { type: fileType });
    
    const metadata = await client.store({
      name: fileName,
      description: `Uploaded file from IPFS Social`,
      image: file
    });
    
    console.log('文件上传到 NFT.Storage 成功:', metadata.ipnft);
    return metadata.ipnft;
  } catch (error) {
    console.error('NFT.Storage 上传失败:', error.message);
    return `ipfs-file-${Date.now()}`;
  }
}

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

    const cid = await uploadToNFTStorage(fileData, fileName, fileType);

    const message = {
      id: Date.now().toString(),
      from,
      to,
      type: 'file',
      fileName,
      fileType,
      fileSize: fileData.length,
      cid,
      timestamp: Date.now(),
      storageType: cid.startsWith('ipfs-file-') ? 'local' : 'nft.storage'
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
      cid
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
