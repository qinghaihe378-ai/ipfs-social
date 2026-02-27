import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllGroupFields() {
  console.log('🧪 测试groups表所有可能的字段组合...\n');

  const fieldCombinations = [
    { name: 'members', value: ['test_user'] },
    { name: 'member', value: ['test_user'] },
    { name: 'member_ids', value: ['test_user'] },
    { name: 'member_id', value: ['test_user'] },
    { name: 'users', value: ['test_user'] },
    { name: 'user_ids', value: ['test_user'] }
  ];

  for (const combo of fieldCombinations) {
    console.log(`\n🔄 尝试字段: ${combo.name}`);
    
    const testGroup = {
      id: 'test_' + Date.now() + '_' + combo.name,
      name: '测试群组',
      creator: 'test_user',
      [combo.name]: combo.value
    };

    const { data, error } = await supabase
      .from('groups')
      .insert(testGroup)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ 失败: ${error.message}`);
    } else {
      console.log(`   ✅ 成功！正确的字段是: ${combo.name}`);
      console.log(`   记录:`, data);
      console.log(`   所有字段:`, Object.keys(data).join(', '));
      
      // 删除测试记录
      await supabase.from('groups').delete().eq('id', data.id);
      return;
    }
  }

  console.log('\n❌ 所有字段组合都失败了');
  console.log('请在Supabase控制台查看groups表的实际结构');
}

testAllGroupFields().catch(console.error);