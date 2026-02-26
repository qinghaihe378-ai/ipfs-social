import { supabase } from './src/supabase.js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // 测试连接
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Users count:', data.length);
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

testSupabaseConnection();
