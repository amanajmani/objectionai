import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('ip_assets').select('count').limit(1);
    if (error) {
      console.log('Database connection test result:', error.message);
    } else {
      console.log('✅ Database connected successfully');
    }
  } catch (err) {
    console.log('Database connection error:', err.message);
  }
}