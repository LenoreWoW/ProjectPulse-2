import { Pool } from 'pg';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Hash password with scrypt
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64));
  return salt + "." + derivedKey.toString("hex");
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
    
    // Password: Hdmin1738!@
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
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

createSuperAdmin(); 