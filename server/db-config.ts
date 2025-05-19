import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Parse SSL setting from environment
const sslEnabled = process.env.DB_SSL === 'true';
const sslConfig = sslEnabled ? { rejectUnauthorized: false } : false;

// Database connection configuration
export const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'projectpulse',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // How long a client is allowed to remain idle before being closed
  ssl: sslConfig
};

console.log('Database configuration:');
console.log(`- Host: ${dbConfig.host}`);
console.log(`- Port: ${dbConfig.port}`);
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.user}`);
console.log(`- SSL Enabled: ${sslEnabled}`);

// Create a new pool instance using the configuration
export const pool = new Pool(dbConfig);

// Function to test the database connection
export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Export an async function to initialize database
export async function initDb() {
  try {
    const connected = await testDbConnection();
    if (!connected) {
      throw new Error('Failed to connect to the database');
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
} 