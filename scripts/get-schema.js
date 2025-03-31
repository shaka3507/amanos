// Get Supabase schema information
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableInfo(tableName) {
  // Get table info from Postgres information_schema
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('*')
    .eq('table_name', tableName);

  if (error) {
    console.error(`Error getting info for table ${tableName}:`, error);
    return null;
  }

  return data;
}

async function getTableNames() {
  // Get all tables in the public schema
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (error) {
    console.error('Error getting table names:', error);
    return [];
  }

  return data.map(t => t.table_name);
}

async function main() {
  try {
    // First get all table names
    const tables = await getTableNames();
    console.log('Tables in public schema:', tables);

    // Then get details for each table
    for (const tableName of tables) {
      const tableInfo = await getTableInfo(tableName);
      console.log(`\n\nTable: ${tableName}`);
      console.log('Columns:', tableInfo);
    }
  } catch (error) {
    console.error('Error exploring schema:', error);
  }
}

main(); 