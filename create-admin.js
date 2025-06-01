import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Hash password with bcrypt (matches auth.ts)
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function createSuperAdmin() {
  try {
    console.log("Checking if Hdmin user exists...");
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['Hdmin']);
    
    if (result.rows.length > 0) {
      console.log("Hdmin user already exists!");
      console.log("User details:", result.rows[0]);
      return;
    }
    
    console.log("Hdmin user does not exist. Creating...");
    
    // Password: Hdmin1738!@ - using bcrypt hash
    const hashedPassword = await hashPassword('Hdmin1738!@');
    
    // Create the super admin user with correct column names
    const insertResult = await pool.query(
      'INSERT INTO users (username, email, name, password, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        'Hdmin',
        'superadmin@example.com',
        'Super Admin',
        hashedPassword,
        'Administrator',
        'Active'
      ]
    );
    
    console.log("Super admin user created successfully!");
    console.log("User details:", insertResult.rows[0]);
    console.log("Default admin credentials:");
    console.log("Username: Hdmin");
    console.log("Password: Hdmin1738!@");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

createSuperAdmin(); 