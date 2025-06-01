const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/project_pulse'
});

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if audit_logs table exists
    const auditResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    console.log('audit_logs table exists:', auditResult.rows[0].exists);
    
    // Check tasks table columns
    const tasksColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND table_schema = 'public'
      ORDER BY column_name;
    `);
    console.log('Tasks table columns:', tasksColumns.rows.map(r => r.column_name));
    
    // Check projects table columns for budget/actualCost
    const projectsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND table_schema = 'public'
      AND column_name IN ('budget', 'actualcost')
      ORDER BY column_name;
    `);
    console.log('Projects budget columns:', projectsColumns.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema(); 