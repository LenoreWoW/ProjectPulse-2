import { Pool } from 'pg';

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    pool.end();
  } catch (error) {
    console.error('Database connection error:', error);
    pool.end();
  }
}

testConnection(); 