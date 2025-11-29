// Database setup script to populate initial data
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://obyyvjwnowrvonteuekw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'your_service_role_key_here'; // You need to get this from Supabase dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Read and execute seed data
    const seedSQL = fs.readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = seedSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error executing statement:', error);
        }
      }
    }

    console.log('✅ Database setup complete!');
    
    // Verify data was inserted
    const { data: ingredients } = await supabase.from('ingredients').select('count');
    const { data: menuitems } = await supabase.from('menuitems').select('count');
    
    console.log('📊 Data verification:');
    console.log(`- Ingredients: ${ingredients?.length || 0} records`);
    console.log(`- Menu items: ${menuitems?.length || 0} records`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();