import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabase.js';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : '';

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
  const [showSettings, setShowSettings] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);

  useEffect(() => {
    checkConnection();
    loadProfile();
    subscribeToTweets();
    loadFriends();
    loadMessages();
  }, []);

  useEffect(() => {
    if (isLoggedIn && username) {
      broadcastOnline();
      loadOfflineMessages();
      subscribeToMessages();
      
      // 订阅实时消息
      const subscription = supabase
        .from(`messages:to_user=eq.${username}`)
        .on('INSERT', (payload) => {
          const newMessage = {
            id: payload.new.id.toString(),
            from: payload.new.from_user,
            to: payload.new.to_user,
            content: payload.new.content,
            type: payload.new.type,
            fileName: payload.new.file_name,
            fileType: payload.new.file_type,
            fileSize: payload.new.file_size,
            cid: payload.new.cid,
            read: payload.new.read,
            timestamp: payload.new.timestamp
          };
          
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (!exists) {
              return [...prev, newMessage];
            }
            return prev;
          });
        })
        .subscribe();
      
      return () => subscription.unsubscribe();
    }
  }, [isLoggedIn, username]);

  const broadcastOnline = async () => {
    // 使用 Supabase 时不需要此函数
    console.log('用户在线:', username);
  };

  const loadOfflineMessages = async () => {
    // 使用 Supabase 时不需要此函数
    console.log('加载消息已由 Supabase 处理');
  };

  const subscribeToMessages = () => {
    // 使用 Supabase 实时订阅，不需要此函数
    console.log('消息订阅已由 Supabase 处理');
  };

  const checkConnection = async () => {
    try {
      // 检查 Supabase 连接
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Supabase 连接检查失败:', error);
        setConnected(false);
      } else {
        setConnected(true);
      }
    } catch (error) {
      console.error('连接检查失败:', error);
      setConnected(false);
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

      const savedPublicKey = localStorage.getItem('publicKey');
      if (!savedPublicKey) {
        alert('本地未找到用户信息，请重新注册');
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      alert('登录成功！');
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
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          bio: '欢迎使用 Mutual',
          avatar: '',
          public_key: keyPair.publicKey
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          alert('该用户名已被注册，请选择其他用户名');
        } else {
          console.error('注册失败:', error);
          alert('注册失败');
        }
      } else {
        setProfileCid(`user-${username}`);
        setPublicKey(keyPair.publicKey);
        localStorage.setItem('profileCid', `user-${username}`);
        localStorage.setItem('username', username);
        localStorage.setItem('publicKey', keyPair.publicKey);
        setIsLoggedIn(true);
        alert('注册成功！');
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
    // 使用 Supabase 时不需要此函数
    console.log('推文订阅已由消息系统处理');
  };

  const postTweet = async () => {
    // 使用消息系统代替推文
    alert('请使用消息系统发送消息');
    setShowCompose(false);
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

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user1.eq.${username},user2.eq.${username}`);

      if (error) {
        console.error('加载好友失败:', error);
        // 加载失败时使用本地存储
        const savedFriends = localStorage.getItem('friends');
        if (savedFriends) {
          setFriends(JSON.parse(savedFriends));
        }
      } else {
        const formattedFriends = data.map(friend => ({
          username: friend.user1 === username ? friend.user2 : friend.user1,
          publicKey: Math.random().toString(36).substring(2, 15),
          addedAt: friend.added_at ? new Date(friend.added_at).getTime() : Date.now()
        }));
        setFriends(formattedFriends);
        localStorage.setItem('friends', JSON.stringify(formattedFriends));
      }
    } catch (error) {
      console.error('加载好友失败:', error);
      const savedFriends = localStorage.getItem('friends');
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends));
      }
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
      // 检查用户是否存在
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('username', friendUsername)
        .limit(1);

      if (userError) {
        console.error('检查用户失败:', userError);
        alert('检查用户失败');
        return;
      }

      if (userData.length === 0) {
        alert('该用户不存在，请确认用户名正确');
        return;
      }

      // 添加好友关系
      const { error: friendError } = await supabase
        .from('friends')
        .insert({
          user1: username,
          user2: friendUsername
        });

      if (friendError) {
        if (friendError.code === '23505') {
          alert('已经是好友了');
        } else {
          console.error('添加好友失败:', friendError);
          alert('添加好友失败');
        }
        return;
      }

      const newFriend = {
        username: friendUsername,
        publicKey: Math.random().toString(36).substring(2, 15),
        addedAt: Date.now()
      };

      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      localStorage.setItem('friends', JSON.stringify(updatedFriends));
      setFriendUsername('');
      setShowAddFriend(false);
      alert('好友添加成功！');
    } catch (error) {
      console.error('添加好友失败:', error);
      alert('添加好友失败');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`from_user.eq.${username},to_user.eq.${username}`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('加载消息失败:', error);
        // 加载失败时使用本地存储
        const savedMessages = localStorage.getItem('messages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } else {
        const formattedMessages = data.map(msg => ({
          id: msg.id.toString(),
          from: msg.from_user,
          to: msg.to_user,
          content: msg.content,
          type: msg.type,
          fileName: msg.file_name,
          fileType: msg.file_type,
          fileSize: msg.file_size,
          cid: msg.cid,
          read: msg.read,
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
        localStorage.setItem('messages', JSON.stringify(formattedMessages));
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      const savedMessages = localStorage.getItem('messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  };

  const sendMessage = async (content, toUser) => {
    if (!content.trim()) return;

    try {
      const timestamp = Date.now();
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          from_user: username,
          to_user: toUser,
          content,
          type: 'text',
          read: false,
          timestamp
        })
        .select();

      if (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败');
      } else {
        const newMessage = {
          id: data[0].id.toString(),
          from: username,
          to: toUser,
          content,
          type: 'text',
          read: false,
          timestamp,
          cid: null
        };
        
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败');
    }
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
      const groupId = Date.now().toString();
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          group_id: groupId,
          name: groupName,
          creator: username
        })
        .select();

      if (error) {
        console.error('创建群组失败:', error);
        alert('创建群组失败');
      } else {
        const newGroup = {
          id: groupId,
          name: groupName,
          creator: username,
          members: [username],
          createdAt: Date.now()
        };
        
        setGroups([...groups, newGroup]);
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
        const timestamp = Date.now();
        const cid = `file-${Date.now()}`;
        
        const { data, error } = await supabase
          .from('messages')
          .insert({
            from_user: username,
            to_user: toUser,
            type: 'file',
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            cid: cid,
            read: false,
            timestamp
          })
          .select();

        if (error) {
          console.error('上传文件失败:', error);
          alert('上传文件失败');
        } else {
          const newMessage = {
            id: data[0].id.toString(),
            from: username,
            to: toUser,
            type: 'file',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            cid: cid,
            timestamp,
            read: false
          };
          
          const updatedMessages = [...messages, newMessage];
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
      // 由于我们使用了 Supabase 存储，这里应该从 Supabase 下载文件
      // 但为了简化，我们暂时使用本地存储的模拟数据
      alert('文件下载功能需要配置 Supabase Storage');
      console.log('下载文件:', fileName, 'CID:', cid);
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
                    <div key={friend.username} className="message-item" onClick={() => { setSelectedChat(friend.username); setActiveTab('messages'); }}>
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
                <div className="contact-item" onClick={() => {}}>
                  <div className="contact-icon orange">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">新的朋友</div>
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
                <div className="contact-item" onClick={() => {}}>
                  <div className="contact-icon blue">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">标签</div>
                  </div>
                </div>
                <div className="contact-item" onClick={() => {}}>
                  <div className="contact-icon yellow">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">公众号</div>
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
                            onClick={() => { setSelectedChat(friend.username); setActiveTab('messages'); }}
                          >
                            <div className="contact-avatar">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="contact-info">
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
                        {tweet.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="moment-content">
                        <div className="moment-author">{tweet.author}</div>
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
            <div className="messages-content desktop-messages">
              <div className="messages-header">
                <div className="messages-title">消息</div>
                <button className="wechat-add-btn" onClick={() => setShowAddFriend(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              
              <div className="desktop-chat-container">
                <div className="messages-list desktop-list">
                  {friends.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无好友，点击右上角添加好友</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div 
                        key={friend.username} 
                        className={`message-item ${selectedChat === friend.username ? 'active' : ''}`} 
                        onClick={() => setSelectedChat(friend.username)}
                      >
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

                {selectedChat && (
                  <div className="chat-view desktop-chat">
                    <div className="chat-header">
                      <div className="chat-user">
                        <div className="chat-avatar">
                          {selectedChat.charAt(0).toUpperCase()}
                        </div>
                        <span className="chat-username">{selectedChat}</span>
                      </div>
                    </div>
                    
                    <div className="chat-messages">
                      {getChatMessages(selectedChat).map(msg => (
                        <div key={msg.id} className={`chat-message ${msg.from === username ? 'sent' : 'received'}`}>
                          <div className="message-content">
                            {msg.content}
                          </div>
                          <div className="message-time">
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="chat-input">
                      <input
                        type="text"
                        placeholder="发送消息"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            sendMessage(e.target.value, selectedChat);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        if (input.value.trim()) {
                          sendMessage(input.value, selectedChat);
                          input.value = '';
                        }
                      }}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                <div className="profile-card-avatar">
                  {(nickname || username) ? (nickname || username).charAt(0).toUpperCase() : '?'}
                </div>
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
        <button className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>我</span>
        </button>
      </nav>

      {/* 移动端发布弹窗 */}
      {showCompose && (
        <div className="compose-modal" onClick={() => setShowCompose(false)}>
          <div className="compose-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compose-modal-header">
              <button onClick={() => setShowCompose(false)} className="close-btn">✕</button>
              <button 
                onClick={postTweet} 
                disabled={loading || !content.trim()}
                className="post-btn"
              >
                发布
              </button>
            </div>
            <div className="compose-modal-body">
              <div className="avatar">
                {username ? username.charAt(0).toUpperCase() : '?'}
              </div>
              <textarea
                placeholder="有什么新鲜事？"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={280}
                autoFocus
              />
            </div>
            <div className="compose-modal-footer">
              <span className="char-count">{content.length}/280</span>
            </div>
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
            <div className="header-placeholder"></div>
          </div>

          <div className="profile-edit-content">
            <div className="profile-edit-item">
              <div className="edit-label">头像</div>
              <div className="edit-avatar">
                {(editUsername || username) ? (editUsername || username).charAt(0).toUpperCase() : '?'}
              </div>
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

            <button 
              className="save-btn"
              onClick={() => {
                if (editUsername.trim()) {
                  setNickname(editUsername);
                  localStorage.setItem('nickname', editUsername);
                  localStorage.setItem('bio', editBio);
                  setShowProfileEdit(false);
                  alert('个人资料已保存');
                } else {
                  alert('昵称不能为空');
                }
              }}
            >
              保存
            </button>
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
                onClick={() => {
                  if (friendUsername.trim()) {
                    alert(`搜索用户: ${friendUsername}`);
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

            {friendUsername.trim() && (
              <div className="search-result">
                <div className="result-header">搜索结果</div>
                <div className="result-item">
                  <div className="result-avatar">
                    {friendUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="result-info">
                    <div className="result-name">{friendUsername}</div>
                    <div className="result-id">Mutual ID: {friendUsername}</div>
                  </div>
                  <button 
                    className="add-btn"
                    onClick={addFriend}
                  >
                    添加到通讯录
                  </button>
                </div>
              </div>
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
