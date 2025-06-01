const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'projectpulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function createAuditLogsTable() {
  try {
    console.log('Creating audit_logs table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        entitytype VARCHAR(50) NOT NULL,
        entityid INTEGER,
        details JSONB,
        ipaddress VARCHAR(45),
        useragent TEXT,
        departmentid INTEGER,
        userid INTEGER,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userid) REFERENCES users(id),
        FOREIGN KEY (departmentid) REFERENCES departments(id)
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ audit_logs table created successfully');
    
    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_userid ON audit_logs(userid);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entitytype ON audit_logs(entitytype);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_createdat ON audit_logs(createdat);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_departmentid ON audit_logs(departmentid);'
    ];
    
    for (const query of indexQueries) {
      await pool.query(query);
    }
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating audit_logs table:', error);
  } finally {
    await pool.end();
  }
}

createAuditLogsTable(); 