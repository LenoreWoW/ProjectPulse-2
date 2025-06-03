#!/usr/bin/env node

/**
 * Database diagnostic script for ProjectPulse
 * This script checks the database connection and displays information about the database structure
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database connection parameters from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'projectpulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? 
    { rejectUnauthorized: false } : 
    process.env.DB_SSL === 'false' ? false : undefined
};

// Create a new pool instance
const pool = new Pool(dbConfig);

async function checkDatabase() {
  console.log('==== Database Diagnostic Tool ====');
  console.log('Connection Parameters:');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
  console.log('==================================');

  try {
    // Test connection
    console.log('\nTesting database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log(`✅ Connection successful! Server time: ${result.rows[0].time}`);
    
    // Check database version
    console.log('\nChecking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL version: ${versionResult.rows[0].version}`);
    
    // List all tables
    console.log('\nListing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the database.');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check projects table structure and data
    console.log('\nChecking projects table...');
    try {
      const projectsResult = await client.query('SELECT COUNT(*) FROM projects');
      console.log(`✅ Projects table exists with ${projectsResult.rows[0].count} records`);
      
      // Get column structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        ORDER BY ordinal_position
      `);
      console.log('Projects table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
      
      // Sample project titles
      const sampleProjects = await client.query('SELECT id, title FROM projects LIMIT 3');
      if (sampleProjects.rows.length > 0) {
        console.log('Sample projects:');
        sampleProjects.rows.forEach(project => {
          console.log(`   - ID ${project.id}: ${project.title}`);
        });
      }
    } catch (error) {
      console.log('❌ Projects table does not exist or cannot be queried');
      console.error(error.message);
    }
    
    // Check milestones table structure
    console.log('\nChecking milestones table...');
    try {
      const milestonesResult = await client.query('SELECT COUNT(*) FROM milestones');
      console.log(`✅ Milestones table exists with ${milestonesResult.rows[0].count} records`);
      
      // Get column structure
      const milestonesColumnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'milestones' 
        ORDER BY ordinal_position
      `);
      console.log('Milestones table columns:');
      milestonesColumnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } catch (error) {
      console.log('❌ Milestones table does not exist or cannot be queried');
      console.error(error.message);
    }
    
    // Check if users table exists and has data
    console.log('\nChecking users table...');
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`✅ Users table exists with ${usersResult.rows[0].count} records`);
      
      // Check if admin user exists
      const adminResult = await client.query("SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin')");
      if (adminResult.rows[0].exists) {
        console.log('✅ Admin user exists');
      } else {
        console.log('❌ Admin user does not exist');
      }
    } catch (error) {
      console.log('❌ Users table does not exist or cannot be queried');
      console.error(error.message);
    }
    
    // Release client back to pool
    client.release();
    
    console.log('\n==================================');
    console.log('Diagnostic complete! Database appears to be properly configured.');
    console.log('==================================');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.log('\nTip: Check your DB_USER and DB_PASSWORD in the .env file');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\nTip: Make sure PostgreSQL is running and accessible at the configured host and port');
    } else if (error.message.includes('database "projectpulse" does not exist')) {
      console.log('\nTip: Run the database initialization script with: npm run db:init');
    }
  } finally {
    // End pool
    await pool.end();
  }
}

// Run the check
checkDatabase().catch(console.error); 