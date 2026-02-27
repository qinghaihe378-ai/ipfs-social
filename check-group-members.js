import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroupMembersTable() {
  console.log('🔍 检查group_members表...\n');

  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ group_members表不存在');
    console.log('错误:', error.message);
  } else {
    console.log('✅ group_members表存在');
    if (data.length > 0) {
      console.log('字段:', Object.keys(data[0]).join(', '));
      console.log('示例记录:', data[0]);
    } else {
      console.log('表为空');
    }
  }
}

checkGroupMembersTable().catch(console.error);