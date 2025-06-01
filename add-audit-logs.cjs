const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse'
});

async function addAuditLogsTable() {
  try {
    console.log('Adding audit_logs table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        entityType VARCHAR(255) NOT NULL,
        entityId INTEGER,
        details JSONB,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        departmentId INTEGER,
        userId INTEGER,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (departmentId) REFERENCES departments(id)
      );
    `);
    
    console.log('Creating indexes for audit_logs...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entityType, entityId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(createdAt);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_department ON audit_logs(departmentId);
    `);
    
    console.log('audit_logs table created successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addAuditLogsTable(); 