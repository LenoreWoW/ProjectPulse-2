// Script to seed Signal Corps department and users
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'projectpulse',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres',
};

console.log('==== Signal Corps Seed Script ====');
console.log('Using database configuration:');
console.log(`- Host: ${dbConfig.host}`);
console.log(`- Port: ${dbConfig.port}`);
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.user}`);
console.log('================================');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function seedSignalCorps() {
  const pool = new Pool(dbConfig);

  try {
    // Create Signal Corps department if it doesn't exist
    const departmentCheckResult = await pool.query(
      `SELECT id FROM departments WHERE name = 'Signal Corps'`
    );
    
    let departmentId;
    
    if (departmentCheckResult.rows.length === 0) {
      // Create the department
      const departmentResult = await pool.query(
        `INSERT INTO departments (name, description) 
         VALUES ('Signal Corps', 'Department responsible for communications and signal intelligence')
         RETURNING id`
      );
      departmentId = departmentResult.rows[0].id;
      console.log(`Signal Corps department created with ID ${departmentId}`);
    } else {
      departmentId = departmentCheckResult.rows[0].id;
      console.log(`Signal Corps department already existed with ID ${departmentId}`);
    }
    
    // Create a Project Manager user
    const pmPassword = await hashPassword('password123');
    const pmResult = await pool.query(
      `INSERT INTO users (name, email, username, password, role, status, departmentid) 
       VALUES ('Project Manager', 'pm@signalcorps.example', 'projectmanager', $1, 'ProjectManager', 'Active', $2)
       ON CONFLICT (username) DO UPDATE SET 
       role = 'ProjectManager', departmentid = $2
       RETURNING id`,
      [pmPassword, departmentId]
    );
    
    console.log(`Project Manager user created or updated with ID ${pmResult.rows[0].id}`);
    
    // Create a Sub-PMO user
    const subPmoPassword = await hashPassword('password123');
    const subPmoResult = await pool.query(
      `INSERT INTO users (name, email, username, password, role, status, departmentid) 
       VALUES ('Sub PMO', 'subpmo@signalcorps.example', 'subpmo', $1, 'SubPMO', 'Active', $2)
       ON CONFLICT (username) DO UPDATE SET 
       role = 'SubPMO', departmentid = $2
       RETURNING id`,
      [subPmoPassword, departmentId]
    );
    
    console.log(`Sub-PMO user created or updated with ID ${subPmoResult.rows[0].id}`);
    
    console.log('Successfully seeded Signal Corps department and users!');
  } catch (error) {
    console.error('Error seeding Signal Corps data:', error);
  } finally {
    await pool.end();
  }
}

seedSignalCorps().catch(console.error);