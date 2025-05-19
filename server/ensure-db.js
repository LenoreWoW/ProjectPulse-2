#!/usr/bin/env node

/**
 * Database initialization script for ProjectPulse
 * This script checks if the database exists and initializes it if necessary
 * It is meant to be run during server startup
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import pg from 'pg';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Pool } = pg;

// Database connection info from environment variables
const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'projectpulse',
  POSTGRES_USER = 'postgres',
  POSTGRES_PASSWORD = 'postgres',
} = process.env;

console.log('==== Database Initialization Check ====');
console.log(`Host: ${POSTGRES_HOST}`);
console.log(`Port: ${POSTGRES_PORT}`);
console.log(`Database: ${POSTGRES_DB}`);
console.log(`User: ${POSTGRES_USER}`);
console.log('=====================================');

// Function to run pg_isready to check if PostgreSQL is running
function runPgCommand(args) {
  return new Promise((resolve, reject) => {
    const command = spawn('psql', args);
    
    let stdout = '';
    let stderr = '';
    
    command.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    command.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    command.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    command.on('error', (err) => {
      reject(new Error(`Failed to execute command: ${err.message}`));
    });
  });
}

// Check if psql client is available
async function checkPsqlAvailable() {
  try {
    await runPgCommand(['--version']);
    return true;
  } catch (error) {
    console.error('PostgreSQL client (psql) is not available in the PATH:', error.message);
    return false;
  }
}

// Check if database exists
async function checkDatabaseExists() {
  try {
    // Connect to postgres database to check if our database exists
    const pool = new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: 'postgres', // Connect to default postgres database
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
    });
    
    const result = await pool.query(`SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'`);
    await pool.end();
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error checking if database exists:', error.message);
    return false;
  }
}

// Create database if it doesn't exist
async function createDatabase() {
  try {
    // Connect to postgres database to create our database
    const pool = new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: 'postgres', // Connect to default postgres database
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
    });
    
    await pool.query(`CREATE DATABASE ${POSTGRES_DB}`);
    await pool.end();
    
    console.log(`Created database: ${POSTGRES_DB}`);
    return true;
  } catch (error) {
    console.error('Error creating database:', error.message);
    return false;
  }
}

// Apply database schema
async function applySchema() {
  try {
    const schemaPath = path.join(__dirname, 'db-init.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Connect to our database to apply schema
    const pool = new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DB,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
    });
    
    await pool.query(schema);
    await pool.end();
    
    console.log('Applied database schema');
    return true;
  } catch (error) {
    console.error('Error applying schema:', error.message);
    return false;
  }
}

// Create admin user if none exists
async function createAdminUser() {
  try {
    // Connect to our database
    const pool = new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DB,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
    });
    
    // Check if admin user exists
    const adminCheck = await pool.query("SELECT 1 FROM users WHERE role = 'Administrator' LIMIT 1");
    
    if (adminCheck.rowCount === 0) {
      // Create admin user
      await pool.query(`
        INSERT INTO users (name, email, username, password, role, departmentId)
        VALUES (
          'Admin User', 
          'admin@example.com', 
          'admin', 
          '$2b$10$GMA5pPjlrXuXUJK8Xh3qN.d0QTx5AFAuA0PpRYt1WP.hKqopSf5xi', -- password: admin123
          'Administrator',
          NULL
        )
      `);
      console.log('Created admin user (username: admin, password: admin123)');
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    return false;
  }
}

// Main initialization function
async function initializeDatabase() {
  console.log('Checking PostgreSQL installation...');
  
  // Check if psql is available
  const isPsqlAvailable = await checkPsqlAvailable();
  if (!isPsqlAvailable) {
    console.error('PostgreSQL client is not available. Please install PostgreSQL and ensure it is in your PATH.');
    process.exit(1);
  }
  
  // Check if database exists
  console.log('Checking if database exists...');
  const dbExists = await checkDatabaseExists();
  
  // Create database if it doesn't exist
  if (!dbExists) {
    console.log(`Database '${POSTGRES_DB}' does not exist. Creating...`);
    const created = await createDatabase();
    if (!created) {
      console.error('Failed to create database. Please check your PostgreSQL installation and permissions.');
      process.exit(1);
    }
  } else {
    console.log(`Database '${POSTGRES_DB}' already exists.`);
  }
  
  // Apply schema
  console.log('Applying database schema...');
  const schemaApplied = await applySchema();
  if (!schemaApplied) {
    console.error('Failed to apply database schema. Please check the error messages above.');
    process.exit(1);
  }
  
  // Create admin user if none exists
  console.log('Ensuring admin user exists...');
  const adminCreated = await createAdminUser();
  if (!adminCreated) {
    console.error('Failed to create admin user. Please check the error messages above.');
    process.exit(1);
  }
  
  console.log('Database initialization complete!');
}

// Run the initialization
initializeDatabase().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
}); 