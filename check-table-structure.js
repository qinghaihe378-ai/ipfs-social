import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 检查表结构...\n');

  // 检查groups表
  console.log('📝 groups表结构:');
  const { data: groupsSample, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .limit(1);
  
  if (groupsSample && groupsSample.length > 0) {
    console.log('示例数据:', groupsSample[0]);
    console.log('字段类型:', Object.keys(groupsSample[0]));
  } else {
    console.log('表为空或错误:', groupsError?.message);
  }

  // 检查messages表
  console.log('\n📝 messages表结构:');
  const { data: messagesSample, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);
  
  if (messagesSample && messagesSample.length > 0) {
    console.log('示例数据:', messagesSample[0]);
    console.log('字段类型:', Object.keys(messagesSample[0]));
  } else {
    console.log('表为空或错误:', messagesError?.message);
  }

  // 检查group_members表
  console.log('\n📝 group_members表结构:');
  const { data: membersSample, error: membersError } = await supabase
    .from('group_members')
    .select('*')
    .limit(1);
  
  if (membersSample && membersSample.length > 0) {
    console.log('示例数据:', membersSample[0]);
    console.log('字段类型:', Object.keys(membersSample[0]));
  } else {
    console.log('表为空或错误:', membersError?.message);
  }
}

checkTableStructure().catch(console.error);
