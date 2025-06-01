import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

console.log("Database configuration:");
console.log(`- Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`- Port: ${parseInt(process.env.POSTGRES_PORT || '5432', 10)}`);
console.log(`- Database: ${process.env.POSTGRES_DB || 'projectpulse'}`);
console.log(`- User: ${process.env.POSTGRES_USER || 'postgres'}`);

// Hash password with bcrypt (matches auth.ts)
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function createSchema() {
  try {
    // Create session table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    console.log("Session table created or already exists");

    // Create departments table with correct column names
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "isactive" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Departments table created or already exists");

    // Create users table with correct column names (matching current schema)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(255) NOT NULL UNIQUE,
        "email" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "password" TEXT NOT NULL,
        "role" VARCHAR(50),
        "status" VARCHAR(50),
        "departmentid" INTEGER REFERENCES "departments"("id"),
        "preferredlanguage" VARCHAR(5) DEFAULT 'en',
        "isactive" BOOLEAN DEFAULT true,
        "phone" VARCHAR(50),
        "passportimage" TEXT,
        "idcardimage" TEXT,
        "title" VARCHAR(255),
        "position" VARCHAR(255),
        "avatarurl" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table created or already exists");

    // Create projects table with correct column names
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "titlear" VARCHAR(255),
        "description" TEXT,
        "descriptionar" TEXT,
        "startdate" DATE,
        "enddate" DATE,
        "deadline" DATE,
        "status" VARCHAR(50),
        "manageruserid" INTEGER REFERENCES "users"("id"),
        "departmentid" INTEGER REFERENCES "departments"("id"),
        "client" VARCHAR(255),
        "priority" VARCHAR(50),
        "budget" DECIMAL(15,2),
        "actualcost" DECIMAL(15,2),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Projects table created or already exists");
    
    // Create Hold department if it doesn't exist
    const holdDepartmentResult = await pool.query(
      'SELECT * FROM departments WHERE LOWER(name) = LOWER($1)',
      ['Hold']
    );
    
    if (holdDepartmentResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO departments (name, description, isactive) VALUES ($1, $2, $3)',
        ['Hold', 'Temporary department for new LDAP users', true]
      );
      console.log("Hold department created");
    } else {
      console.log("Hold department already exists");
    }
    
    // Create Admin department if it doesn't exist
    const adminDepartmentResult = await pool.query(
      'SELECT * FROM departments WHERE LOWER(name) = LOWER($1)',
      ['Administration']
    );
    
    let adminDepartmentId;
    if (adminDepartmentResult.rows.length === 0) {
      const result = await pool.query(
        'INSERT INTO departments (name, description, isactive) VALUES ($1, $2, $3) RETURNING id',
        ['Administration', 'Department for administrators', true]
      );
      adminDepartmentId = result.rows[0].id;
      console.log("Administration department created");
    } else {
      adminDepartmentId = adminDepartmentResult.rows[0].id;
      console.log("Administration department already exists");
    }
    
    // Create Hdmin super admin user if it doesn't exist
    const hdminResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      ['Hdmin']
    );
    
    if (hdminResult.rows.length === 0) {
      // Hash the password: Hdmin1738!@ - using bcrypt hash
      const hashedPassword = await hashPassword('Hdmin1738!@');
      
      await pool.query(
        'INSERT INTO users (username, email, name, password, role, status, departmentid, preferredlanguage, isactive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'Hdmin', 
          'superadmin@example.com', 
          'Super Admin', 
          hashedPassword, 
          'Administrator', 
          'Active', 
          adminDepartmentId,
          'en',
          true
        ]
      );
      console.log("Hdmin super admin user created");
      console.log("Default admin credentials:");
      console.log("Username: Hdmin");
      console.log("Password: Hdmin1738!@");
    } else {
      console.log("Hdmin super admin user already exists");
    }
    
    // Create admin user if it doesn't exist
    const adminResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      ['admin']
    );
    
    if (adminResult.rows.length === 0) {
      // Hash the password: admin123 - using bcrypt hash
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(
        'INSERT INTO users (username, email, name, password, role, status, departmentid, preferredlanguage, isactive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'admin', 
          'admin@example.com', 
          'Admin User', 
          hashedPassword, 
          'Administrator', 
          'Active', 
          adminDepartmentId,
          'en',
          true
        ]
      );
      console.log("Admin user created");
      console.log("Additional admin credentials:");
      console.log("Username: admin");
      console.log("Password: admin123");
    } else {
      console.log("Admin user already exists");
    }
    
    console.log("Database schema and initial data setup completed");
  } catch (error) {
    console.error("Error creating schema:", error);
  } finally {
    await pool.end();
  }
}

createSchema(); 