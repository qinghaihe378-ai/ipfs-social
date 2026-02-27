export const getInitial = (str) => {
  return str && str.charAt(0) ? str.charAt(0).toUpperCase() : '?';
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString();
};

export const generateKeyPair = () => {
  const privateKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const publicKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return { privateKey, publicKey };
};

export const validateUsername = (username) => {
  if (!username) return '请输入用户名';
  if (username.length < 3) return '用户名至少需要3个字符';
  if (username.length > 20) return '用户名不能超过20个字符';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return '用户名只能包含字母、数字和下划线';
  return null;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};