import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.PROD ? 'https://ipfs-social.vercel.app' : 'http://localhost:3001';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setStoredValue = (value) => {
    try {
      setValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('存储失败:', error);
    }
  };

  return [value, setStoredValue];
};

export const useDataSync = (endpoint, username, interval = 30000) => {
  const [data, setData] = useState([]);
  const { request, loading, error } = useApi();

  const sync = async () => {
    if (!username) return;
    try {
      const result = await request(endpoint);
      if (result.success) {
        setData(result.data || result.friends || result.groups || result.tweets || []);
      }
    } catch (error) {
      console.error('同步数据失败:', error);
    }
  };

  useEffect(() => {
    sync();
    const intervalId = setInterval(sync, interval);
    return () => clearInterval(intervalId);
  }, [endpoint, username, interval]);

  return { data, sync, loading, error };
};