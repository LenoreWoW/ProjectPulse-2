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

async function fixAdminPassword() {
  try {
    console.log("Updating Hdmin user password with bcrypt...");
    
    // Hash the password with bcrypt (same as auth.ts)
    const password = 'Hdmin1738!@';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("New bcrypt hash:", hashedPassword);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
      [hashedPassword, 'Hdmin']
    );
    
    if (result.rows.length > 0) {
      console.log("Password updated successfully!");
      console.log("User details:", {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        status: result.rows[0].status
      });
      
      // Test the password
      const isValid = await bcrypt.compare(password, hashedPassword);
      console.log("Password verification test:", isValid);
    } else {
      console.log("User not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

fixAdminPassword(); 