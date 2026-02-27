import { useState, useEffect, useRef } from 'react';
import './App.css';
import Wallet from './components/Wallet';
import Bot from './components/Bot';

const API_BASE = import.meta.env.PROD ? 'https://ipfs-social.vercel.app' : 'http://localhost:3001';

function App() {
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [profileCid, setProfileCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showCompose, setShowCompose] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatarUrl') || '');
  const avatarInputRef = useRef(null);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'zh');
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const recordingInterval = useRef(null);

  useEffect(() => {
    checkConnection();
    loadProfile();
    loadTweets();
    loadFriends();
    loadMessages();
    const cleanup = subscribeToTweets();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isLoggedIn && username) {
      broadcastOnline();
      loadOfflineMessages();
      subscribeToMessages();
    }
  }, [isLoggedIn, username]);

  const broadcastOnline = async () => {
    try {
      await fetch(`${API_BASE}/api/user-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
    } catch (error) {
      console.error('广播在线状态失败:', error);
    }
  };

  const loadOfflineMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/offline-messages/${username}`);
      const data = await response.json();
      
      if (data.success && data.messages.length > 0) {
        setMessages(prev => {
          const newMessages = [...prev, ...data.messages];
          localStorage.setItem('messages', JSON.stringify(newMessages));
          return newMessages;
        });
      }
    } catch (error) {
      console.error('加载离线消息失败:', error);
    }
  };

  const subscribeToMessages = () => {
    const eventSource = new EventSource(`${API_BASE}/api/subscribe-messages/${username}`);
    
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (!exists) {
          const updated = [...prev, message];
          localStorage.setItem('messages', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    };

    eventSource.onerror = (error) => {
      console.error('消息订阅错误:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  };

  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();
      setConnected(data.ipfsConnected);
    } catch (error) {
      console.error('连接检查失败:', error);
    }
  };

  const generateKeyPair = () => {
    const keyPair = {
      publicKey: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      privateKey: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    };
    setPublicKey(keyPair.publicKey);
    localStorage.setItem('privateKey', keyPair.privateKey);
    return keyPair;
  };

  const login = async () => {
    if (!username) {
      alert('请输入用户名');
      return;
    }

    try {
      setLoading(true);

      let savedPublicKey = localStorage.getItem('publicKey');
      
      // 如果本地没有存储，尝试从服务器获取用户信息
      if (!savedPublicKey) {
        const response = await fetch(`${API_BASE}/api/profile?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        if (data.success && data.users && data.users.length > 0) {
          const user = data.users[0];
          
          if (user && user.public_key) {
            // 找到用户，更新本地存储
            savedPublicKey = user.public_key;
            localStorage.setItem('publicKey', savedPublicKey);
            localStorage.setItem('username', username);
            setPublicKey(savedPublicKey);
          } else {
            alert('用户不存在，请重新注册');
            setLoading(false);
            return;
          }
        } else {
          alert('用户不存在，请重新注册');
          setLoading(false);
          return;
        }
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!username) {
      alert('请输入用户名');
      return;
    }

    if (username.length < 3) {
      alert('用户名至少需要3个字符');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      alert('用户名只能包含字母、数字和下划线');
      return;
    }

    try {
      setLoading(true);

      const keyPair = generateKeyPair();
      
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio: '欢迎使用 Mutual',
          avatar: '',
          publicKey: keyPair.publicKey
        })
      });

      const data = await response.json();
      if (data.success) {
        setProfileCid(data.cid);
        setPublicKey(keyPair.publicKey);
        localStorage.setItem('profileCid', data.cid);
        localStorage.setItem('username', username);
        localStorage.setItem('publicKey', keyPair.publicKey);
        setIsLoggedIn(true);
      } else if (data.code === 'USERNAME_EXISTS') {
        alert('该用户名已被注册，请选择其他用户名');
      }
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = () => {
    const savedUsername = localStorage.getItem('username');
    const savedNickname = localStorage.getItem('nickname');
    const savedPublicKey = localStorage.getItem('publicKey');
    const savedProfileCid = localStorage.getItem('profileCid');
    
    if (savedUsername) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
    }
    if (savedNickname) setNickname(savedNickname);
    if (savedPublicKey) setPublicKey(savedPublicKey);
    if (savedProfileCid) setProfileCid(savedProfileCid);
  };

  const subscribeToTweets = () => {
    const eventSource = new EventSource(`${API_BASE}/api/subscribe`);
    
    eventSource.onmessage = (event) => {
      try {
        const tweet = JSON.parse(event.data);
        if (!tweet.error) {
          setTweets(prev => [tweet, ...prev]);
        }
      } catch (error) {
        console.error('解析推文失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource 错误:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  };

  const postTweet = async () => {
    if (!content.trim()) {
      alert('请输入推文内容');
      return;
    }

    if (!username || !publicKey) {
      alert('请先创建用户资料');
      setShowCompose(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author: publicKey,
          username,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      if (data.success) {
        setTweets(prev => [data.tweet, ...prev]);
        setContent('');
        setShowCompose(false);
      }
    } catch (error) {
      console.error('发布推文失败:', error);
      alert('发布推文失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const loadFriends = () => {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    }
  };

  const removeFriend = (friendUsername) => {
    const updatedFriends = friends.filter(f => f.username !== friendUsername);
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
  };

  const [friendRequests, setFriendRequests] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  useEffect(() => {
    if (isLoggedIn && username) {
      loadFriendRequests();
    }
  }, [isLoggedIn, username]);

  const loadFriendRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friend-requests/${encodeURIComponent(username)}`);
      const data = await response.json();
      if (data.success) {
        setFriendRequests(data.requests);
      }
    } catch (error) {
      console.error('加载好友申请失败:', error);
    }
  };

  const addFriend = async () => {
    if (!friendUsername.trim()) {
      alert('请输入好友用户名');
      return;
    }

    if (friendUsername === username) {
      alert('不能添加自己为好友');
      return;
    }

    if (friends.some(f => f.username === friendUsername)) {
      alert('已经是好友了');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/check-user-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: friendUsername })
      });
      
      const data = await response.json();
      
      if (!data.exists) {
        alert('该用户不存在，请确认用户名正确');
        return;
      }

      // 发送好友申请
      const requestResponse = await fetch(`${API_BASE}/api/send-friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from: username, 
          to: friendUsername 
        })
      });
      
      const requestData = await requestResponse.json();
      
      if (requestData.success) {
        setFriendUsername('');
        setShowAddFriend(false);
        alert('好友申请已发送！');
      } else {
        alert('发送好友申请失败: ' + (requestData.error || '未知错误'));
      }
    } catch (error) {
      console.error('添加好友失败:', error);
      alert('添加好友失败');
    }
  };

  const respondToFriendRequest = async (requestId, action) => {
    try {
      const response = await fetch(`${API_BASE}/api/respond-friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          username, 
          action 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (action === 'accept') {
          // 添加到好友列表
          const newFriend = {
            username: data.request.from,
            publicKey: Math.random().toString(36).substring(2, 15),
            addedAt: Date.now()
          };
          const updatedFriends = [...friends, newFriend];
          setFriends(updatedFriends);
          localStorage.setItem('friends', JSON.stringify(updatedFriends));
          alert('已添加好友！');
        }
        // 更新好友申请列表
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        alert('处理好友申请失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('处理好友申请失败:', error);
      alert('处理好友申请失败');
    }
  };

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const checkForNewFriendRequests = async () => {
    if (isLoggedIn && username) {
      await loadFriendRequests();
    }
  };

  // 定期检查新的好友申请
  useEffect(() => {
    if (isLoggedIn && username) {
      const interval = setInterval(checkForNewFriendRequests, 30000); // 每30秒检查一次
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, username]);

  const loadTweets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tweets`);
      const data = await response.json();
      if (data.tweets) {
        setTweets(data.tweets);
      }
    } catch (error) {
      console.error('加载动态失败:', error);
    }
  };

  // 表情包数据
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥'
  ];

  // 处理表情包点击
  const handleEmojiClick = (emoji) => {
    if (selectedChat) {
      sendMessage(emoji, selectedChat);
      setShowEmojiPicker(false);
    }
  };

  // 开始录音
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // 停止录音
  const stopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    setRecordingTime(0);
    // 这里可以添加实际的录音处理逻辑
  };

  const sendMessage = async (content, toUser) => {
    if (!content.trim() || !username || !toUser) return;

    try {
      const newMessage = {
        id: Date.now().toString(),
        from: username,
        to: toUser,
        content,
        timestamp: Date.now()
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem('messages', JSON.stringify(updatedMessages));

      const response = await fetch(`${API_BASE}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: username,
          to: toUser,
          content,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('发送消息失败:', data);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const deleteMessage = (messageId) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  const clearChatMessages = (friendUsername) => {
    const updatedMessages = messages.filter(
      msg => !((msg.from === username && msg.to === friendUsername) ||
               (msg.from === friendUsername && msg.to === username))
    );
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  const getChatMessages = (friendUsername) => {
    return messages.filter(
      msg => (msg.from === username && msg.to === friendUsername) ||
             (msg.from === friendUsername && msg.to === username)
    ).sort((a, b) => a.timestamp - b.timestamp);
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert('请输入群组名称');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/create-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName,
          creator: username,
          members: [username]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGroups([...groups, data.group]);
        setGroupName('');
        setShowCreateGroup(false);
        alert('群组创建成功！');
      }
    } catch (error) {
      console.error('创建群组失败:', error);
      alert('创建群组失败');
    }
  };

  const sendGroupMessage = async (content, groupId) => {
    if (!content.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/send-group-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: username,
          groupId,
          content,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedMessages = [...messages, data.message];
        setMessages(updatedMessages);
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error('发送群消息失败:', error);
      alert('发送群消息失败');
    }
  };

  const uploadFile = async (file, toUser) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result.split(',')[1];
      
      try {
        const response = await fetch(`${API_BASE}/api/upload-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData,
            fileName: file.name,
            fileType: file.type,
            from: username,
            to: toUser
          })
        });

        const data = await response.json();
        
        if (data.success) {
          const updatedMessages = [...messages, data.message];
          setMessages(updatedMessages);
          localStorage.setItem('messages', JSON.stringify(updatedMessages));
          setShowFileUpload(false);
          alert('文件发送成功！');
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        alert('上传文件失败');
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadFile = async (cid, fileName) => {
    try {
      const response = await fetch(`${API_BASE}/api/download-file/${cid}`);
      const data = await response.json();
      
      if (data.success) {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${data.fileData}`;
        link.download = fileName;
        link.click();
      }
    } catch (error) {
      console.error('下载文件失败:', error);
      alert('下载文件失败');
    }
  };

  return (
    <div className="app">
      {!isLoggedIn ? (
        <div className="login-page">
          <div className="login-container">
            <div className="login-logo">
              <svg viewBox="0 0 24 24" fill="#07c160">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <h1 className="login-title">Mutual</h1>
            </div>
            
            <div className="login-form">
              <div className="login-input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (isRegisterMode ? register() : login())}
                />
              </div>
              
              {isRegisterMode ? (
                <>
                  <button 
                    className="login-button"
                    onClick={register}
                    disabled={loading}
                  >
                    {loading ? '注册中...' : '注册'}
                  </button>
                  <div className="login-switch">
                    <span>已有账号？</span>
                    <button className="switch-btn" onClick={() => setIsRegisterMode(false)}>
                      立即登录
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    className="login-button"
                    onClick={login}
                    disabled={loading}
                  >
                    {loading ? '登录中...' : '登录'}
                  </button>
                  <div className="login-switch">
                    <span>没有账号？</span>
                    <button className="switch-btn" onClick={() => setIsRegisterMode(true)}>
                      立即注册
                    </button>
                  </div>
                </>
              )}
              
              <div className="login-info">
                <p>基于 IPFS + PubSub 的去中心化社交网络</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* 桌面端左侧导航栏 */}
      <nav className="sidebar-left">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
        
        <div className="nav-items">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"/>
            </svg>
            <span>首页</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.697 3H11v2h-.697C7.303 5 5 7.426 5 10.5c0 1.385.448 2.67 1.21 3.714l1.44-1.44C7.246 12.053 7 11.313 7 10.5 7 8.57 8.57 7 10.303 7H11v2.5l4-3.5-4-3.5V3zm4.606 6.786l-1.44 1.44C13.754 11.947 14 12.687 14 13.5c0 1.93-1.57 3.5-3.303 3.5H10v-2.5l-4 3.5 4 3.5V19h1.697c3.303 0 5.606-2.426 5.606-5.5 0-1.385-.448-2.67-1.21-3.714z"/>
            </svg>
            <span>探索</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z"/>
            </svg>
            <span>通知</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"/>
            </svg>
            <span>私信</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 0-2 2c0 .74.4 1.39 1 1.73V7H8a4 4 0 0 0-4 4v1H2v2h2v1a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1h2v-2h-2v-1a4 4 0 0 0-4-4h-3V5.73c.6-.34 1-.99 1-1.73a2 2 0 0 0-2-2zm-4 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 3c1.5 0 3 .75 3 2H9c0-1.25 1.5-2 3-2z"/>
            </svg>
            <span>Bot</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/>
            </svg>
            <span>书签</span>
          </button>
          
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z"/>
            </svg>
            <span>个人资料</span>
          </button>
        </div>
        
        <button className="post-btn-large" onClick={() => setShowCompose(true)}>发布</button>
        
        {profileCid && (
          <div className="user-profile">
            <div className="avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{username}</div>
              <div className="user-handle">@{username}</div>
            </div>
          </div>
        )}
      </nav>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 桌面端标题栏 */}
        <header className="main-header">
          <h1>首页</h1>
          <div className="tabs">
            <button className={`tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>推荐</button>
            <button className={`tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>关注</button>
          </div>
        </header>

        {/* 桌面端推文发布框 */}
        <div className="tweet-compose">
          <div className="avatar">
            {username ? username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="compose-area">
            <textarea
              placeholder="有什么新鲜事？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={280}
            />
            <div className="compose-actions">
              <span className="char-count">{content.length}/280</span>
              <button 
                onClick={postTweet} 
                disabled={loading || !content.trim()}
                className="post-btn"
              >
                发布
              </button>
            </div>
          </div>
        </div>

        {/* 时间线 */}
        <div className="feed">
          {activeTab === 'home' && (
            <div className="wechat-content">
              {!selectedChat ? (
                <>
                  <div className="wechat-header">
                    <div className="wechat-title">Mutual</div>
                    <button className="wechat-add-btn" onClick={() => setShowAddFriend(true)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="messages-list">
                    {friends.length === 0 ? (
                      <div className="empty-state">
                        <p>暂无好友，点击右上角添加</p>
                      </div>
                    ) : (
                      friends.map(friend => (
                        <div key={friend.username} className="message-item" onClick={() => setSelectedChat(friend.username)}>
                          <div className="message-avatar">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="message-info">
                            <div className="message-name">{friend.username}</div>
                            <div className="message-preview">
                              {getChatMessages(friend.username).length > 0
                                ? getChatMessages(friend.username)[getChatMessages(friend.username).length - 1].content
                                : '暂无消息'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="chat-view mobile-chat">
                  <div className="chat-header">
                    <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                    <div className="chat-user">
                      <span className="chat-username">{selectedChat}</span>
                    </div>
                    <button 
                      className="chat-more-btn" 
                      onClick={() => {
                        if (confirm('确定要清空与该好友的聊天记录吗？')) {
                          clearChatMessages(selectedChat);
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="chat-messages">
                    {getChatMessages(selectedChat).map(msg => (
                      <div 
                        key={msg.id} 
                        className={`chat-message ${msg.from === username ? 'sent' : 'received'}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (confirm('确定要删除这条消息吗？')) {
                            deleteMessage(msg.id);
                          }
                        }}
                      >
                        {msg.from !== username && (
                          <div className="message-avatar">
                            {msg.from.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="message-wrapper">
                          <div className="message-content">
                            {msg.content}
                          </div>
                          <div className="message-time">
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                        {msg.from === username && (
                          <div className="message-avatar">
                            {msg.from.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="chat-input">
                    <button 
                      className="chat-input-btn" 
                      onMouseDown={startRecording} 
                      onMouseUp={stopRecording} 
                      onMouseLeave={stopRecording}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 10c-1.1 0-2 .9-2 2h8c0-1.1-.9-2-2-2h-4z"/>
                      </svg>
                      {isRecording && (
                        <div className="recording-indicator">
                          <div className="recording-dot"></div>
                          <span>{recordingTime}s</span>
                        </div>
                      )}
                    </button>
                    <input
                      type="text"
                      placeholder="发送消息"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && messageInput.trim()) {
                          sendMessage(messageInput, selectedChat);
                          setMessageInput('');
                        }
                      }}
                    />
                    <button className="chat-input-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                      </svg>
                    </button>
                    {messageInput.trim() ? (
                      <button 
                        className="chat-send-btn" 
                        onClick={() => {
                          if (messageInput.trim()) {
                            sendMessage(messageInput, selectedChat);
                            setMessageInput('');
                          }
                        }}
                      >
                        发送
                      </button>
                    ) : (
                      <button className="chat-input-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* 表情包选择器 */}
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <div className="emoji-grid">
                        {emojis.map((emoji, index) => (
                          <button 
                            key={index} 
                            className="emoji-item" 
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="contacts-content">
              <div className="contacts-header">
                <div className="contacts-title">通讯录</div>
                <button className="add-contact-btn" onClick={() => setShowAddFriend(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              
              <div className="contacts-list">
                <div className="contact-item" onClick={() => setShowFriendRequests(true)}>
                  <div className="contact-icon orange">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">新的朋友</div>
                    {friendRequests.length > 0 && (
                      <div className="contact-badge">{friendRequests.length}</div>
                    )}
                  </div>
                </div>
                <div className="contact-item" onClick={() => {}}>
                  <div className="contact-icon green">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">群聊</div>
                  </div>
                </div>
                
                {friends.length > 0 && (
                  <>
                    {Object.entries(
                      friends
                        .sort((a, b) => a.username.localeCompare(b.username))
                        .reduce((acc, friend) => {
                          const firstLetter = friend.username.charAt(0).toUpperCase();
                          if (!acc[firstLetter]) {
                            acc[firstLetter] = [];
                          }
                          acc[firstLetter].push(friend);
                          return acc;
                        }, {})
                    ).map(([letter, friendsList]) => (
                      <div key={letter} className="contact-section">
                        <div className="section-header">{letter}</div>
                        {friendsList.map(friend => (
                          <div 
                            key={friend.username} 
                            className="contact-item"
                          >
                            <div 
                              className="contact-avatar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFriend(friend);
                                setShowFriendProfile(true);
                              }}
                            >
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                            <div 
                              className="contact-info"
                              onClick={() => { setSelectedChat(friend.username); setActiveTab('messages'); }}
                            >
                              <div className="contact-name">{friend.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="explore-content">
              <div className="explore-header">
                <div className="explore-title">发现</div>
                <button className="explore-compose-btn" onClick={() => setShowCompose(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4h-2v4H8v-7h2v1.5h.25c.41-.75 1.16-1.5 2.25-1.5s1.84.75 2.25 1.5H16v-1.5h2v7z"/>
                  </svg>
                </button>
              </div>
              <div className="moments-list">
                {tweets.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无动态</p>
                  </div>
                ) : (
                  tweets.map(tweet => (
                    <div key={tweet.id} className="moment-item">
                      <div className="moment-avatar">
                        {(tweet.username || tweet.author).charAt(0).toUpperCase()}
                      </div>
                      <div className="moment-content">
                        <div className="moment-author">{tweet.username || tweet.author}</div>
                        <div className="moment-text">{tweet.content}</div>
                        <div className="moment-time">{formatDate(tweet.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-content">
              <h2>通知</h2>
              <div className="empty-state">
                <p>暂无通知</p>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="wechat-content">
              {!selectedChat ? (
                <>
                  <div className="wechat-header">
                    <div className="wechat-title">消息</div>
                    <button className="wechat-add-btn" onClick={() => setShowAddFriend(true)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="messages-list">
                    {friends.length === 0 ? (
                      <div className="empty-state">
                        <p>暂无好友，点击右上角添加好友</p>
                      </div>
                    ) : (
                      friends.map(friend => (
                        <div key={friend.username} className="message-item" onClick={() => setSelectedChat(friend.username)}>
                          <div className="message-avatar">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="message-info">
                            <div className="message-name">{friend.username}</div>
                            <div className="message-preview">
                              {getChatMessages(friend.username).length > 0
                                ? getChatMessages(friend.username)[getChatMessages(friend.username).length - 1].content
                                : '暂无消息'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="chat-view mobile-chat">
                  <div className="chat-header">
                    <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                    <div className="chat-user">
                      <span className="chat-username">{selectedChat}</span>
                    </div>
                    <button 
                      className="chat-more-btn" 
                      onClick={() => {
                        if (confirm('确定要清空与该好友的聊天记录吗？')) {
                          clearChatMessages(selectedChat);
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="chat-messages">
                    {getChatMessages(selectedChat).map(msg => (
                      <div 
                        key={msg.id} 
                        className={`chat-message ${msg.from === username ? 'sent' : 'received'}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (confirm('确定要删除这条消息吗？')) {
                            deleteMessage(msg.id);
                          }
                        }}
                      >
                        {msg.from !== username && (
                          <div className="message-avatar">
                            {msg.from.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="message-wrapper">
                          <div className="message-content">
                            {msg.content}
                          </div>
                          <div className="message-time">
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                        {msg.from === username && (
                          <div className="message-avatar">
                            {msg.from.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="chat-input">
                    <button 
                      className="chat-input-btn" 
                      onMouseDown={startRecording} 
                      onMouseUp={stopRecording} 
                      onMouseLeave={stopRecording}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 10c-1.1 0-2 .9-2 2h8c0-1.1-.9-2-2-2h-4z"/>
                      </svg>
                      {isRecording && (
                        <div className="recording-indicator">
                          <div className="recording-dot"></div>
                          <span>{recordingTime}s</span>
                        </div>
                      )}
                    </button>
                    <input
                      type="text"
                      placeholder="发送消息"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && messageInput.trim()) {
                          sendMessage(messageInput, selectedChat);
                          setMessageInput('');
                        }
                      }}
                    />
                    <button className="chat-input-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                      </svg>
                    </button>
                    {messageInput.trim() ? (
                      <button 
                        className="chat-send-btn" 
                        onClick={() => {
                          if (messageInput.trim()) {
                            sendMessage(messageInput, selectedChat);
                            setMessageInput('');
                          }
                        }}
                      >
                        发送
                      </button>
                    ) : (
                      <button className="chat-input-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* 表情包选择器 */}
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <div className="emoji-grid">
                        {emojis.map((emoji, index) => (
                          <button 
                            key={index} 
                            className="emoji-item" 
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="bookmarks-content">
              <h2>书签</h2>
              <div className="empty-state">
                <p>暂无书签</p>
              </div>
            </div>
          )}

          {activeTab === 'bot' && (
            <Bot />
          )}

          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="profile-page-header">
                <div className="profile-page-title">我</div>
              </div>
              
              <div className="profile-card" onClick={() => {
                setEditUsername(nickname || username);
                setEditBio(localStorage.getItem('bio') || '');
                setShowProfileEdit(true);
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="profile-card-avatar-img" />
                ) : (
                  <div className="profile-card-avatar">
                    {(nickname || username) ? (nickname || username).charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="profile-card-info">
                  <div className="profile-card-name">{nickname || username || '未登录'}</div>
                  <div className="profile-card-id">Mutual ID: {username ? username.substring(0, 8) : 'mid_xxxxx'}</div>
                  <div className="profile-card-bio">{localStorage.getItem('bio') || '点击编辑个人资料'}</div>
                </div>
                <div className="profile-card-right">
                  <div className="profile-card-qrcode">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z"/>
                    </svg>
                  </div>
                  <div className="profile-card-arrow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-item" onClick={() => setShowWalletModal(true)}>
                  <div className="profile-item-icon wallet-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </div>
                  <div className="profile-item-text">钱包</div>
                  <div className="profile-item-arrow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                    </svg>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-icon favorite-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="profile-item-text">收藏</div>
                  <div className="profile-item-arrow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                    </svg>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-icon moments-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <div className="profile-item-text">朋友圈</div>
                  <div className="profile-item-arrow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-item" onClick={() => setShowSettings(true)}>
                  <div className="profile-item-icon setting-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                  </div>
                  <div className="profile-item-text">设置</div>
                  <div className="profile-item-arrow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 桌面端右侧边栏 */}
      <aside className="sidebar-right">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.73 3.815-1.945 5.207l4.718 4.718-1.414 1.414-4.718-4.718C14.065 17.77 12.236 18.5 10.25 18.5c-4.694 0-8.5-3.806-8.5-8.5z"/>
          </svg>
          <input type="text" placeholder="搜索" />
        </div>

        <div className="trends">
          <h2>趋势</h2>
          <div className="trend-item">
            <div className="trend-category">技术 · 趋势</div>
            <div className="trend-name">#IPFS</div>
            <div className="trend-count">12.5K 推文</div>
          </div>
          <div className="trend-item">
            <div className="trend-category">科技 · 趋势</div>
            <div className="trend-name">#去中心化</div>
            <div className="trend-count">8.3K 推文</div>
          </div>
          <div className="trend-item">
            <div className="trend-category">区块链 · 趋势</div>
            <div className="trend-name">#Web3</div>
            <div className="trend-count">5.2K 推文</div>
          </div>
        </div>

        <div className="who-to-follow">
          <h2>推荐关注</h2>
          <div className="follow-item">
            <div className="follow-avatar">I</div>
            <div className="follow-info">
              <div className="follow-name">IPFS</div>
              <div className="follow-handle">@IPFS</div>
            </div>
            <button className="follow-btn">关注</button>
          </div>
          <div className="follow-item">
            <div className="follow-avatar">P</div>
            <div className="follow-info">
              <div className="follow-name">Protocol Labs</div>
              <div className="follow-handle">@ProtocolLabs</div>
            </div>
            <button className="follow-btn">关注</button>
          </div>
        </div>

        <div className="footer-links">
          <a href="#">服务条款</a>
          <a href="#">隐私政策</a>
          <a href="#">Cookie 政策</a>
          <a href="#">无障碍</a>
          <a href="#">广告信息</a>
          <span>© 2024 IPFS Social</span>
        </div>
      </aside>

      {/* 移动端底部导航栏 */}
      <nav className="mobile-nav">
        <button className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          <span>Mutual</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
          <span>通讯录</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"/>
          </svg>
          <span>发现</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a2 2 0 0 0-2 2c0 .74.4 1.39 1 1.73V7H8a4 4 0 0 0-4 4v1H2v2h2v1a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1h2v-2h-2v-1a4 4 0 0 0-4-4h-3V5.73c.6-.34 1-.99 1-1.73a2 2 0 0 0-2-2zm-4 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 3c1.5 0 3 .75 3 2H9c0-1.25 1.5-2 3-2z"/>
          </svg>
          <span>Bot</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>我</span>
        </button>
      </nav>

      {/* 移动端发布页面 */}
      {showCompose && (
        <div className="compose-page">
          <div className="compose-page-header">
            <button onClick={() => setShowCompose(false)} className="back-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="compose-page-title">发表文字</div>
            <button 
              onClick={postTweet} 
              disabled={loading || !content.trim()}
              className="post-btn"
            >
              发表
            </button>
          </div>
          <div className="compose-page-content">
            <textarea
              className="compose-textarea"
              placeholder="这一刻的想法..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* 个人资料编辑弹窗 */}
      {showProfileEdit && (
        <div className="profile-edit-page">
          <div className="profile-edit-header">
            <button className="back-btn" onClick={() => setShowProfileEdit(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="profile-edit-title">个人信息</div>
            <button 
              className="save-btn-header"
              onClick={() => {
                if (editUsername.trim()) {
                  setNickname(editUsername);
                  localStorage.setItem('nickname', editUsername);
                  localStorage.setItem('bio', editBio);
                  setShowProfileEdit(false);
                } else {
                  alert('昵称不能为空');
                }
              }}
            >
              保存
            </button>
          </div>

          <div className="profile-edit-content">
            <div className="profile-edit-item avatar-edit-item" onClick={() => avatarInputRef.current?.click()}>
              <div className="edit-label">头像</div>
              <div className="edit-avatar-wrapper">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="edit-avatar-img" />
                ) : (
                  <div className="edit-avatar">
                    {(editUsername || username) ? (editUsername || username).charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <svg className="avatar-edit-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const url = reader.result;
                      setAvatarUrl(url);
                      localStorage.setItem('avatarUrl', url);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="profile-edit-item">
              <div className="edit-label">昵称</div>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="edit-input"
                placeholder="请输入昵称"
              />
            </div>

            <div className="profile-edit-item">
              <div className="edit-label">Mutual ID</div>
              <div className="edit-value">{username ? username.substring(0, 8) : 'mid_xxxxx'}</div>
            </div>

            <div className="profile-edit-item">
              <div className="edit-label">个性签名</div>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="edit-input"
                placeholder="请输入个性签名"
              />
            </div>
          </div>
        </div>
      )}

      {/* 好友资料页面 */}
      {showFriendProfile && selectedFriend && (
        <div className="friend-profile-page">
          <div className="friend-profile-header">
            <button className="back-btn" onClick={() => {
              setShowFriendProfile(false);
              setSelectedFriend(null);
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="friend-profile-title">详细资料</div>
            <div className="header-placeholder"></div>
          </div>

          <div className="friend-profile-content">
            <div className="friend-profile-card">
              <div className="friend-profile-avatar">
                {selectedFriend.username.charAt(0).toUpperCase()}
              </div>
              <div className="friend-profile-info">
                <div className="friend-profile-name">{selectedFriend.username}</div>
                <div className="friend-profile-id">Mutual ID: {selectedFriend.username.substring(0, 8)}</div>
              </div>
            </div>

            <div className="friend-profile-section">
              <div className="friend-profile-item">
                <div className="friend-item-label">来源</div>
                <div className="friend-item-value">通过搜索添加</div>
              </div>
              <div className="friend-profile-item">
                <div className="friend-item-label">添加时间</div>
                <div className="friend-item-value">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div className="friend-profile-actions">
              <button 
                className="friend-action-btn primary"
                onClick={() => {
                  setSelectedChat(selectedFriend.username);
                  setShowFriendProfile(false);
                  setActiveTab('messages');
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                发消息
              </button>
              <button 
                className="friend-action-btn danger"
                onClick={() => {
                  if (confirm(`确定要删除好友 ${selectedFriend.username} 吗？`)) {
                    removeFriend(selectedFriend.username);
                    setShowFriendProfile(false);
                    setSelectedFriend(null);
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                删除好友
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设置页面 */}
      {showSettings && (
        <div className="settings-page">
          <div className="settings-header">
            <button className="back-btn" onClick={() => setShowSettings(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="settings-title">设置</div>
            <div className="header-placeholder"></div>
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <div className="settings-item">
                <div className="settings-item-text">账号与安全</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-item">
                <div className="settings-item-text">新消息通知</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-text">隐私</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-text">通用</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
              <div className="settings-item" onClick={() => setShowLanguageSelect(true)}>
                <div className="settings-item-text">语言</div>
                <div className="settings-item-value">
                  {language === 'zh' ? '中文' : language === 'en' ? 'English' : language === 'ja' ? '日本語' : language === 'fr' ? 'Français' : language === 'de' ? 'Deutsch' : '中文'}
                </div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-item">
                <div className="settings-item-text">帮助与反馈</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-text">关于Mutual</div>
                <div className="settings-item-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41L14.17 12l4.58-4.59L10 6z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-item" onClick={() => {
                localStorage.clear();
                setUsername('');
                setIsLoggedIn(false);
                setShowSettings(false);
              }}>
                <div className="settings-item-text logout-text">退出登录</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 钱包模态框 */}
      {showWalletModal && (
        <div className="wallet-page">
          <div className="wallet-page-header">
            <button className="back-btn" onClick={() => setShowWalletModal(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="wallet-page-title">钱包</div>
            <div className="header-placeholder"></div>
          </div>
          <div className="wallet-page-content">
            <Wallet />
          </div>
        </div>
      )}

      {/* 添加好友页面 */}
      {showAddFriend && (
        <div className="add-friend-page">
          <div className="add-friend-header">
            <button className="back-btn" onClick={() => setShowAddFriend(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="add-friend-title">添加朋友</div>
            <div className="header-placeholder"></div>
          </div>

          <div className="add-friend-content">
            <div className="search-section">
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Mutual ID"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  className="search-input-friend"
                />
              </div>
              <button 
                className="search-btn"
                onClick={async () => {
                  if (friendUsername.trim()) {
                    try {
                      const response = await fetch(`${API_BASE}/api/check-user-online`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: friendUsername })
                      });
                      
                      const data = await response.json();
                      
                      if (data.exists) {
                        setSearchResult({ username: friendUsername });
                        alert(`用户 ${friendUsername} 已找到`);
                      } else {
                        setSearchResult(null);
                        alert(`用户 ${friendUsername} 不存在`);
                      }
                    } catch (error) {
                      console.error('搜索用户失败:', error);
                      setSearchResult(null);
                      alert('搜索用户失败');
                    }
                  }
                }}
              >
                搜索
              </button>
            </div>

            <div className="add-methods">
              <div className="method-item">
                <div className="method-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className="method-text">Mutual联系人</div>
                <div className="method-desc">通过Mutual添加</div>
              </div>
            </div>

            {searchResult && (
              <div className="search-result">
                <div className="result-header">搜索结果</div>
                <div className="result-item">
                  <div className="result-avatar">
                    {searchResult.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="result-info">
                    <div className="result-name">{searchResult.username}</div>
                    <div className="result-id">Mutual ID: {searchResult.username}</div>
                  </div>
                  <button 
                    className="add-btn"
                    onClick={() => {
                      setFriendUsername(searchResult.username);
                      addFriend();
                    }}
                  >
                    添加到通讯录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 语言选择页面 */}
      {showLanguageSelect && (
        <div className="language-select-page">
          <div className="language-select-header">
            <button className="back-btn" onClick={() => setShowLanguageSelect(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="language-select-title">语言</div>
            <div className="header-placeholder"></div>
          </div>

          <div className="language-select-content">
            <div className="language-item" onClick={() => {
              setLanguage('zh');
              localStorage.setItem('language', 'zh');
              setShowLanguageSelect(false);
            }}>
              <div className="language-name">中文</div>
              {language === 'zh' && (
                <div className="language-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="language-item" onClick={() => {
              setLanguage('en');
              localStorage.setItem('language', 'en');
              setShowLanguageSelect(false);
            }}>
              <div className="language-name">English</div>
              {language === 'en' && (
                <div className="language-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="language-item" onClick={() => {
              setLanguage('ja');
              localStorage.setItem('language', 'ja');
              setShowLanguageSelect(false);
            }}>
              <div className="language-name">日本語</div>
              {language === 'ja' && (
                <div className="language-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="language-item" onClick={() => {
              setLanguage('fr');
              localStorage.setItem('language', 'fr');
              setShowLanguageSelect(false);
            }}>
              <div className="language-name">Français</div>
              {language === 'fr' && (
                <div className="language-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="language-item" onClick={() => {
              setLanguage('de');
              localStorage.setItem('language', 'de');
              setShowLanguageSelect(false);
            }}>
              <div className="language-name">Deutsch</div>
              {language === 'de' && (
                <div className="language-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 好友申请页面 */}
      {showFriendRequests && (
        <div className="friend-requests-page">
          <div className="friend-requests-header">
            <button className="back-btn" onClick={() => setShowFriendRequests(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="friend-requests-title">好友申请</div>
            <div className="header-placeholder"></div>
          </div>

          <div className="friend-requests-content">
            {friendRequests.length === 0 ? (
              <div className="empty-state">
                <p>暂无好友申请</p>
              </div>
            ) : (
              friendRequests.map(request => (
                <div key={request.id} className="friend-request-item">
                  <div className="request-avatar">
                    {request.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-info">
                    <div className="request-name">{request.from}</div>
                    <div className="request-message">{request.message || '请求添加您为好友'}</div>
                    <div className="request-time">{formatDate(request.createdAt)}</div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="request-action-btn accept-btn"
                      onClick={() => respondToFriendRequest(request.id, 'accept')}
                    >
                      接受
                    </button>
                    <button 
                      className="request-action-btn reject-btn"
                      onClick={() => respondToFriendRequest(request.id, 'reject')}
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

export default App;
