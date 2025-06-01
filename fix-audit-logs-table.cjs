const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'projectpulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixAuditLogsTable() {
  try {
    console.log('Dropping and recreating audit_logs table with correct column names...');
    
    // Drop the table first
    await pool.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
    console.log('✅ Dropped existing audit_logs table');
    
    const createTableQuery = `
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(255) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        departmentid INTEGER,
        userid INTEGER,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (departmentid) REFERENCES departments(id) ON DELETE SET NULL
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ audit_logs table created successfully with correct column names');
    
    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_userid ON audit_logs(userid);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_createdat ON audit_logs(createdat);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_departmentid ON audit_logs(departmentid);'
    ];
    
    for (const query of indexQueries) {
      await pool.query(query);
    }
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error fixing audit_logs table:', error);
  } finally {
    await pool.end();
  }
}

fixAuditLogsTable(); 