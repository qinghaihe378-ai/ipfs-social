import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 检查数据库表...\n');

  const tables = ['users', 'friend_requests', 'friends', 'messages', 'groups', 'tweets'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 存在 (${data.length} 条记录)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n📊 检查好友请求表结构...');
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ 错误:', error.message);
      console.log('错误代码:', error.code);
      console.log('错误详情:', error);
    } else {
      console.log('✅ 表结构正常');
      if (data.length > 0) {
        console.log('示例记录:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ 异常:', err.message);
  }

  console.log('\n📝 检查所有表...');
  try {
    const { data, error } = await supabase.rpc('get_tables');
    if (error) {
      console.log('无法获取表列表，可能需要手动检查');
    } else {
      console.log('数据库中的表:', data);
    }
  } catch (err) {
    console.log('RPC调用失败，请手动检查Supabase控制台');
  }
}

checkTables().catch(console.error);