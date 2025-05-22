import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 7000;

// Middleware
app.use(express.json());
app.use(cors());

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Test route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Database test route
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Available routes:');
  console.log(`- GET http://localhost:${port}/test`);
  console.log(`- GET http://localhost:${port}/db-test`);
}); 