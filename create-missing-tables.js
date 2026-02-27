import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🔧 创建缺失的数据库表...\n');

  // 创建 friend_requests 表
  console.log('📝 创建 friend_requests 表...');
  try {
    const { error } = await supabase.rpc('create_friend_requests_table');
    
    if (error) {
      console.log('⚠️  RPC调用失败，尝试直接插入测试记录...');
      
      // 尝试直接插入一条记录，如果表不存在会失败
      const { error: insertError } = await supabase
        .from('friend_requests')
        .insert({
          id: 'test_' + Date.now(),
          from_user: 'test_user',
          to_user: 'test_user_2',
          message: 'test',
          status: 'pending',
          created_at: Date.now()
        });
      
      if (insertError) {
        console.log('❌ friend_requests 表不存在:', insertError.message);
        console.log('\n请在Supabase控制台执行以下SQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  from_user VARCHAR(50) NOT NULL,
  to_user VARCHAR(50) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at BIGINT,
  FOREIGN KEY (from_user) REFERENCES users(username),
  FOREIGN KEY (to_user) REFERENCES users(username)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
        `);
      } else {
        console.log('✅ friend_requests 表已存在');
      }
    } else {
      console.log('✅ friend_requests 表创建成功');
    }
  } catch (err) {
    console.log('❌ 创建失败:', err.message);
  }

  // 创建 tweets 表
  console.log('\n📝 创建 tweets 表...');
  try {
    const { error: insertError } = await supabase
      .from('tweets')
      .insert({
        id: 'test_' + Date.now(),
        username: 'test_user',
        content: 'test tweet',
        cid: '',
        timestamp: Date.now()
      });
    
    if (insertError) {
      console.log('❌ tweets 表不存在:', insertError.message);
      console.log('\n请在Supabase控制台执行以下SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  cid TEXT,
  timestamp BIGINT,
  FOREIGN KEY (username) REFERENCES users(username)
);

CREATE INDEX IF NOT EXISTS idx_tweets_username ON tweets(username);
CREATE INDEX IF NOT EXISTS idx_tweets_timestamp ON tweets(timestamp);
      `);
    } else {
      console.log('✅ tweets 表已存在');
    }
  } catch (err) {
    console.log('❌ 创建失败:', err.message);
  }

  console.log('\n✨ 完成！');
  console.log('\n如果表仍然不存在，请：');
  console.log('1. 登录 https://supabase.com/dashboard');
  console.log('2. 选择你的项目');
  console.log('3. 点击 SQL Editor');
  console.log('4. 复制上面的SQL并执行');
}

createMissingTables().catch(console.error);